import { Sequelize } from "sequelize";
import { models as db } from "../utils/postgres.js";
import { v4 as uuidv4 } from "uuid";
import createLogger from "../common/logger.js";
import { _getReportRelatedFiles } from "./file.js";
import { _encryptData, _signData } from "../utils/sm2.js";
import { _mintNFT } from "./wallet.js";
const logger = createLogger("reportController");

export const createReport = async (ctx) => {
    const { templateId } = ctx.request.params;
    const annual = new Date().getFullYear();
    const reportUUID = uuidv4();

    const existingReport = await db.tblReport.findAll({
        where: {
            user_id: ctx.session.user.id,
            annual
        }
    });

    // 检查是否已经创建过报告
    if (existingReport.length > 0) {
        ctx.fail({
            code: 400,
            message: "Report already exists"
        });
    }

    // Check if the template exists
    const template = await db.tblReportTemplate.findOne({
        where: { id: templateId },
    });

    const report = await db.tblReport.create({
        uuid: reportUUID,
        template_id: templateId,
        user_id: ctx.session.user.id,
        annual,
        report_data: template.field_data.map((field) => {
            return {
                id: field.id,
                data: 0
            }
        }),
        status: 0,
    });

    ctx.success({
        data: {
            uuid: reportUUID,
        }
    });
}

export const withdrawReport = async (ctx) => {
    const { reportUUID } = ctx.request.params;
    const { id } = ctx.session.user;

    const report = await db.tblReport.findOne({
        where: { uuid: reportUUID, user_id: id }
    });

    if (!report) {
        return ctx.fail({
            code: 404,
            message: "Report not found"
        });
    }

    // Only status 1/2 can be withdrawn
    if (report.status !== 1 && report.status !== 2) {
        return ctx.fail({
            code: 400,
            message: "Report status invalid"
        });
    }

    await db.tblReport.update({
        status: 0,
    }, {
        where: { uuid: reportUUID }
    });

    ctx.success({
        message: "Report withdrawn successfully"
    });

}

export const deleteReport = async (ctx) => {
    const { reportUUID } = ctx.request.params;
    const { id } = ctx.session.user;

    const report = await db.tblReport.findOne({
        where: { uuid: reportUUID, user_id: id }
    });

    if (!report) {
        return ctx.fail({
            code: 404,
            message: "Report not found"
        });
    }

    // Only status 0 can be deleted
    if (report.status !== 0) {
        return ctx.fail({
            code: 400,
            message: "Report status invalid"
        });
    }

    await db.tblReport.destroy({
        where: { uuid: reportUUID }
    });

    ctx.success({
        message: "Report deleted successfully"
    });
}

export const getReportTemplateList = async (ctx) => {
    // sort by id
    const templates = await db.tblReportTemplate.findAll({
        attributes: ["id", "display_name"],
        order: [["id", "ASC"]]
    });

    ctx.success({
        data: templates.map((template) => {
            return {
                id: parseInt(template.id),
                displayName: template.display_name
            }
        })
    });
}

export const getReportFormData = async (ctx) => {
    const { reportUUID } = ctx.request.params;

    const report = await db.tblReport.findOne({
        where: { uuid: reportUUID }
    });

    if (!report) {
        return ctx.fail({
            code: 404,
            message: "Report not found"
        });
    }

    const template = await db.tblReportTemplate.findOne({
        where: { id: report.template_id }
    });

    if (!template) {
        return ctx.fail({
            code: 404,
            message: "Template not found"
        });
    }

    const reportData = report.report_data;
    const fields = template.field_data.map((field) => {
        return {
            id: field.id,
            unit: field.unit,
            displayName: field.displayName,
            data: reportData.find((d) => d.id === field.id)?.data || 0
        }
    });

    const reportRelatedFiles = await _getReportRelatedFiles(report.id);
    const additionalFileData = template.additional_file_data.map((file) => {
        const relatedFile = reportRelatedFiles.find((f) => f.document_type === file.id);
        return {
            id: file.id,
            displayName: file.displayName,
            // fileName: relatedFile ? `${relatedFile.file_uuid}.${relatedFile.file_format}` : null
            file: {
                originalName: relatedFile ? relatedFile.original_name : null,
                uuid: relatedFile ? relatedFile.file_uuid : null,
                fileName: relatedFile ? `${relatedFile.file_uuid}.${relatedFile.file_format}` : null
            }
        }
    });

    ctx.success({
        data: {
            fields,
            additional_file_data: additionalFileData,
            transaction_hash: report.transaction_hash,
            nft_id: report.nft_id,
            reject_reason: report.reject_reason,
            created_at: report.created_date,
            updated_at: report.updated_date,
            status: report.status
        }
    });
}

export const saveReportData = async (ctx) => {
    const { reportUUID } = ctx.request.params;
    const { data } = ctx.request.body;

    if (!Array.isArray(data)) {
        return ctx.fail({
            code: 400,
            message: "Invalid request"
        });
    }

    const report = await db.tblReport.findOne({
        where: { uuid: reportUUID }
    });

    const templateFields = await db.tblReportTemplate.findOne({
        where: { id: report.template_id }
    });

    // Check if all required fields are present
    // [
    //     { id: 1, unit: 'tCO2', displayName: '燃料燃烧排放量' },
    //     { id: 2, unit: 'tCO2', displayName: '净购入使用的电力、热力产生的排放量' }
    //   ]
    // 传入参数:
    // {
    //   "reportUUID": "string",
    //   "data": [{ id: 1, data: 10 }, { id: 2, data: 20 }]
    // }

    let reportData = [];

    for (const field of templateFields.field_data) {
        if (!data.find((d) => d.id === field.id)) {
            return ctx.fail({
                code: 400,
                message: "Missing required fields"
            });
        }

        // check if is number
        if (typeof field.data === "number") {
            return ctx.fail({
                code: 400,
                message: "Invalid data type"
            });
        }

        reportData.push({
            id: field.id,
            data: data.find((d) => d.id === field.id).data
        });
    }

    // Save report data
    await db.tblReport.update({
        report_data: reportData,
        updated_date: new Date()
    }, {
        where: { uuid: reportUUID }
    });

    ctx.success({
        message: "Report data saved successfully"
    });
}

export const submitReport = async (ctx) => {
    const { reportUUID } = ctx.request.params;

    const report = await db.tblReport.findOne({
        where: { uuid: reportUUID }
    });

    const reportTemplate = await db.tblReportTemplate.findOne({
        where: { id: report.template_id }
    });

    if (!report) {
        return ctx.fail({
            code: 404,
            message: "Report not found"
        });
    }

    if (report.status !== 0) {
        return ctx.fail({
            code: 400,
            message: "Report status invalid"
        });
    }

    // Check additional files
    const reportRelatedFiles = await _getReportRelatedFiles(report.id);
    const requiredFiles = reportTemplate.additional_file_data;

    for (const file of requiredFiles) {
        if (!reportRelatedFiles.find((f) => f.document_type === file.id)) {
            return ctx.fail({
                code: 400,
                message: "Missing required files"
            });
        }
    }

    await db.tblReport.update({
        status: 1,
        updated_date: new Date(),
        reject_reason: null
    }, {
        where: { uuid: reportUUID }
    });

    ctx.success({
        message: "Report submitted successfully"
    });
}

export const getCurrentUserReports = async (ctx, next) => {
    const limit = ctx.query.limit || 10;
    const page = ctx.query.page || 1;

    if (ctx.session.user.role === 2 || ctx.session.user.role === 3) {
        return await next();
    }

    const reports = await db.tblReport.findAndCountAll({
        where: { user_id: ctx.session.user.id },
        include: [
            {
                model: db.tblReportTemplate,
                as: "template",
                attributes: ["display_name"]
            }
        ],
        limit,
        offset: (page - 1) * limit
    });

    const response = reports.rows.map((report) => {
        return {
            uuid: report.uuid,
            annual: report.annual,
            company: ctx.session.user.company,
            template: report.template.display_name,
            status: report.status
        }
    });

    ctx.success({
        data: {
            total: reports.count,
            reports: response
        }
    });
}

export const getAllReports = async (ctx) => {
    const limit = ctx.query.limit || 10;
    const page = ctx.query.page || 1;

    const reports = await db.tblReport.findAndCountAll({
        include: [
            {
                model: db.tblUser,
                as: "user",
                attributes: ["first_name", "last_name", "company"]
            },
            {
                model: db.tblReportTemplate,
                as: "template",
                attributes: ["display_name"]
            },
        ],
        limit,
        offset: (page - 1) * limit
    });

    const response = reports.rows.map((report) => {
        return {
            uuid: report.uuid,
            annual: report.annual,
            company: report.user.company,
            user: {
                firstName: report.user.first_name,
                lastName: report.user.last_name,
            },
            created_at: report.created_date,
            updated_at: report.updated_date,
            template: report.template.display_name,
            status: report.status
        }
    });

    ctx.success({
        data: {
            total: reports.count,
            reports: response
        }
    });

}

export const getPendingReviewReports = async (ctx) => {
    const limit = ctx.query.limit || 10;
    const page = ctx.query.page || 1;

    const reports = await db.tblReport.findAndCountAll({
        where: { status: 1 },
        include: [
            {
                model: db.tblUser,
                as: "user",
                attributes: ["first_name", "last_name", "company"]
            },
            {
                model: db.tblReportTemplate,
                as: "template",
                attributes: ["display_name"]
            }
        ],
        limit,
        offset: (page - 1) * limit
    });

    // build response
    const response = reports.rows.map((report) => {
        return {
            uuid: report.uuid,
            annual: report.annual,
            company: report.user.company,
            user: {
                firstName: report.user.first_name,
                lastName: report.user.last_name,
            },
            created_at: report.created_date,
            updated_at: report.updated_date,
            template: report.template.display_name,
            status: report.status
        }
    });

    ctx.success({
        data: {
            total: reports.count,
            reports: response
        }
    });
}

export const approveReport = async (ctx) => {
    const { reportUUID } = ctx.request.params;

    const report = await db.tblReport.findOne({
        where: { uuid: reportUUID }
    });

    if (!report) {
        return ctx.fail({
            code: 404,
            message: "Report not found"
        });
    }

    if (report.status !== 1) {
        return ctx.fail({
            code: 400,
            message: "Report status invalid"
        });
    }

    await db.tblReport.update({
        updated_date: new Date(),
        reject_reason: null,
        status: 3
    }, {
        where: { uuid: reportUUID }
    });

    // TODO: SM2加密+签名Payload，上链

    ctx.success({
        message: "Report approved successfully"
    });
}

export const rejectReport = async (ctx) => {
    const { reportUUID } = ctx.request.params;
    const { reject_reason } = ctx.request.body;

    const report = await db.tblReport.findOne({
        where: { uuid: reportUUID }
    });

    if (!report) {
        return ctx.fail({
            code: 404,
            message: "Report not found"
        });
    }

    if (report.status !== 1) {
        return ctx.fail({
            code: 400,
            message: "Report status invalid"
        });
    }

    await db.tblReport.update({
        reject_reason,
        updated_date: new Date(),
        status: 2
    }, {
        where: { uuid: reportUUID }
    });

    ctx.success({
        message: "Report rejected successfully"
    });
}

export const mintReport = async (ctx) => {
    const { reportUUID } = ctx.request.params;

    const report = await db.tblReport.findOne({
        where: { uuid: reportUUID }
    });

    if (!report) {
        return ctx.fail({
            code: 404,
            message: "Report not found"
        });
    }

    if (report.status !== 3) {
        return ctx.fail({
            code: 400,
            message: "Report status invalid"
        });
    }

    const reportId = report.id;
    const reportUserId = report.user_id;
    const reportData = report.report_data;


    if (reportUserId !== ctx.session.user.id) {
        return ctx.fail({
            code: 403,
            message: "Permission denied"
        });
    }

    if (!reportData || reportData.length === 0) {
        return ctx.fail({
            code: 400,
            message: "Report data not found"
        });
    }


    const userWallet = await db.tblWallet.findOne({
        where: { user_id: reportUserId }
    });

    if (!userWallet) {
        return ctx.fail({
            code: 400,
            message: "User wallet not found"
        });
    }

    const userWalletAddress = `0x${userWallet.wallet_address}`;

    const totalEmission = reportData.reduce((acc, field) => {
        return acc + field.data;
    }, 0);

    const dataBeforeEncryption = {
        uuid: report.uuid,
        data: reportData,
        totalEmission: totalEmission
    };

    const encryptedData = await _encryptData(JSON.stringify(dataBeforeEncryption));
    const sign = await _signData(encryptedData);

    // 上链
    const payload = {
        company: ctx.session.user.company,
        reportDetail: `${encryptedData}.${sign}`,
        reportYear: report.annual,
        reportCost: totalEmission
    };

    try {
        await _mintNFT(userWalletAddress, reportId, payload);
    } catch (error) {
        logger.error("Failed to mint report", error);
        return ctx.fail({
            code: 500,
            message: "Failed to mint report"
        });
    }

    await db.tblReport.update({
        status: 4,
        updated_date: new Date()
    }, {
        where: { uuid: reportUUID }
    });

    ctx.success({
        message: "Report minted successfully"
    });

}

export const searchReports = async (ctx) => {
    const { annual, company } = ctx.query;
    const limit = ctx.query.limit || 10;
    const page = ctx.query.page || 1;

    const where = {};

    if (annual) {
        where.annual = annual;
    }

    if (company) {
        where.company = company;
    }

    const reports = await db.tblReport.findAndCountAll({
        where: {
            ...where,
            status: {
                [Sequelize.Op.gte]: 3
            }
        },
        include: [
            {
                model: db.tblUser,
                as: "user",
                attributes: ["first_name", "last_name", "company"]
            },
            {
                model: db.tblReportTemplate,
                as: "template",
                attributes: ["display_name"]
            },
            {
                model: db.tblUser,
                as: "approve_by_tbl_user",
                attributes: ["first_name", "last_name"]
            }
        ],
        limit,
        offset: (page - 1) * limit
    });

    const response = reports.rows.map((report) => {
        return {
            uuid: report.uuid,
            annual: report.annual,
            company: report.user.company,
            user: {
                firstName: report.user.first_name,
                lastName: report.user.last_name,
            },
            created_at: report.created_date,
            updated_at: report.updated_date,
            template: report.template.display_name,
            reviewer: {
                firstName: report.approve_by_tbl_user?.first_name,
                lastName: report.approve_by_tbl_user?.last_name
            },
            status: report.status
        }
    });

    ctx.success({
        data: {
            total: reports.count,
            reports: response
        }
    });
}