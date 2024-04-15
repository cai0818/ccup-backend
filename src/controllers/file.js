import multer from "@koa/multer";
import { v4 as uuidv4 } from "uuid";
import createLogger from "../common/logger.js";
import { models as db, sequelize } from "../utils/postgres.js";

import * as fs from "fs";
import * as path from "path";

const logger = createLogger("fileController");
/**
 * @description: 文件上传
 * @author:29046
 * @date: 2024/4/7
 * @parameter: form-data  参数file
 * [
 *    {
 *        "description": "",
 *        "field_type": "String",
 *        "is_checked": 1,
 *        "key": "file",
 *        "value": [
 *            "01 计算机网络概论.pdf"
 *        ],
 *        "not_null": 1,
 *        "type": "File",
 *        "filename": "01 计算机网络概论.pdf",
 *        "fileBase64": []
 *    }
 * ]
 * @return  : code 200
 */
export const uploadFile = async (ctx) => {
    const { fileType } = ctx.request.params;
    const allowedTypes = ['accountVerify', 'reportProof'];
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    const userid = ctx.session.user.id;
    const uuid = uuidv4();

    const userInfo = await db.tblUser.findOne({ where: { id: userid } });

    if (!allowedTypes.includes(fileType)) {
        ctx.fail({
            code: 400,
            message: "Invalid file type"
        });
        return;
    }

    // 如果是 accountVerify 文件，用户必须是未验证状态
    if (fileType === 'accountVerify' && userInfo.verified !== 0) {
        ctx.fail({
            code: 403,
            message: "This state is not allowed to upload files"
        });
        return;
    }

    // 如果是 reportProof 文件，用户必须是已验证状态
    if (fileType === 'reportProof' && userInfo.verified !== 1) {
        ctx.fail({
            code: 403,
            message: "This state is not allowed to upload files"
        });
        return;
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, `./public/${fileType}`);
        },
        filename: function (req, file, cb) {
            const customFileName = `${uuid}.${file.originalname.split('.').pop()}`;
            cb(null, customFileName);
        }
    });

    const fileFilter = (req, file, cb) => {
        // 中文乱码
        file.originalname = Buffer.from(file.originalname, "latin1").toString("utf-8");
        const extension = file.originalname.split('.').pop();
        cb(null, allowedExtensions.includes(extension));
    };

    const upload = multer({ storage: storage, fileFilter: fileFilter }).single("file");

    try {
        await upload(ctx, async (err) => {
            if (err) {
                ctx.fail({ code: 500, message: "File upload failed" });
                return;
            }

            const file_format = ctx.request.file.originalname.split('.').pop();
            const documentData = { user_id: userid, file_format, file_uuid: uuid, original_name: ctx.request.file.originalname };
            logger.info(`File uploaded: ${ctx.request.file.originalname}`);

            try {
                if (fileType === 'accountVerify') {
                    await db.tblAccountDocument.create(documentData);
                } else if (fileType === 'reportProof') {
                    const reportUUID = ctx.request.query.uuid;
                    const documentType = ctx.request.query.type;

                    const report = await db.tblReport.findOne({
                        where: { uuid: reportUUID }
                    });

                    if (!report) {
                        ctx.fail({ code: 404, message: "Report not found" });
                        return;
                    }

                    if (report.user_id !== userid) {
                        ctx.fail({ code: 403, message: "You are not the owner of this report" });
                        return;
                    }

                    const reportId = report.id;
                    const reportTemplate = await db.tblReportTemplate.findOne({
                        where: { id: report.template_id }
                    });

                    const allowedAdditionalFiles = reportTemplate.additional_file_data;
                    const allowedAdditionalFilesIds = allowedAdditionalFiles.map(file => file.id);

                    if (!allowedAdditionalFilesIds.includes(parseInt(documentType))) {
                        ctx.fail({ code: 403, message: "Invalid document type" });
                        return;
                    }

                    const fileData = await db.tblReportDocument.findOne({
                        where: { report_id: reportId, document_type: documentType }
                    });

                    if (fileData) {
                        await db.tblReportDocument.destroy({
                            where: { report_id: reportId, document_type: documentType }
                        });

                        await unlinkFile('reportProof', `${fileData.file_uuid}.${fileData.file_format}`);
                    }

                    await db.tblReportDocument.create({
                        ...documentData,
                        report_id: reportId,
                        document_type: documentType
                    });
                }

                ctx.success({ code: 200, message: "File uploaded successfully.", data: { uuid } });
            } catch (dbError) {
                logger.error(dbError);
                ctx.fail({ code: 500, message: "File uploaded successfully, but failed to save to database" });
            }
        });
    } catch (error) {
        ctx.fail({ code: 500, message: "File upload failed" });
    }
}


/**
 * @description: 用户没验证完毕或没提交验证请求就可以删
 * @author:29046
 * @date: 2024/4/8
 * @parameter: uuid
 * {
 *     "uuid":"b5fb252c-b61b-4a6e-bb92-3605aa6123bf"
 * }
 * @return: code 200  or 500
 */
export const deleteFile = async (ctx) => {
    const userid = ctx.session.user.id;
    const fileType = ctx.request.params.fileType;
    const uuid = ctx.request.body.uuid;

    switch (fileType) {
        case 'accountVerify':
            const userInfo = await db.tblUser.findOne({ where: { id: userid } });
            if (userInfo.verified !== 0) {
                ctx.fail({
                    code: 403,
                    message: "This state is not allowed to delete files",
                });
                return;
            }

            // Check file existence
            const file = await db.tblAccountDocument.findOne({
                where: { file_uuid: uuid }
            });

            if (!file) {
                return ctx.fail({
                    code: 404,
                    message: "File not found"
                });
            }

            // Delete the file from the database
            await db.tblAccountDocument.destroy({
                where: { file_uuid: uuid }
            });

            try {
                await unlinkFile('accountVerify', `${uuid}.${file.file_format}`);
            } catch (error) {
                logger.error(error);
                return ctx.fail({
                    code: 500,
                    message: "Failed to delete file"
                });
            }
            break;
        case 'reportProof':
            const reportUUID = ctx.request.body.reportUUID;

            // Find report by UUID
            const report = await db.tblReport.findOne({
                where: { uuid: reportUUID }
            });

            if (!report) {
                return ctx.fail({
                    code: 404,
                    message: "Report not found"
                });
            }

            // Check ownership and getId
            if (report.user_id !== userid) {
                return ctx.fail({
                    code: 403,
                    message: "You are not the owner of this report"
                });
            }

            // If report status is not 0
            if (report.status !== 0) {
                return ctx.fail({
                    code: 403,
                    message: "Report status invalid"
                });
            }

            const reportId = report.id;

            // Check file existence
            const fileData = await db.tblReportDocument.findOne({
                where: { report_id: reportId, file_uuid: uuid }
            });


            if (!fileData) {
                return ctx.fail({
                    code: 404,
                    message: "File not found"
                });
            }

            // Delete the file from the database
            await db.tblReportDocument.destroy({
                where: { file_uuid: uuid }
            });

            try {
                await unlinkFile('reportProof', `${uuid}.${fileData.file_format}`);
            } catch (error) {
                logger.error(error);
                return ctx.fail({
                    code: 500,
                    message: "Failed to delete file"
                });
            }
            break;
        default:
            ctx.fail({ code: 400, message: "Invalid file type" });

    }

    ctx.success({ code: 200, message: "File deleted successfully" });
}

export const getUserAccountFiles = async (ctx) => {
    const currentUserId = ctx.session.user.id;
    const userId = ctx.request.query.userId;

    const queryUserId = userId ? userId : currentUserId;

    if (userId && currentUserId !== userId && ctx.session.user.role < 2) {
        ctx.fail({ code: 403, message: "You are not allowed to view other user's files" });
        return;
    }

    const accountFiles = await db.tblAccountDocument.findAll({
        attributes: ['id', 'file_uuid', 'file_format', 'original_name'],
        where: { user_id: queryUserId }
    });

    ctx.success({ code: 200, data: accountFiles });
}

export const getReportRelatedFiles = async (ctx) => {
    const reportUUID = ctx.request.params.reportUUID;
    const report = await db.tblReport.findOne({
        where: { uuid: reportUUID }
    });

    if (!report) {
        return ctx.fail({ code: 404, message: "Report not found" });
    }

    const reportFiles = await _getReportRelatedFiles(report.id);

    ctx.success({ code: 200, data: reportFiles });
}

export const downloadFile = async (ctx) => {
    const { fileType } = ctx.request.params;
    const { uuid } = ctx.request.query;

    if (!uuid) {
        return ctx.fail({ code: 400, message: "UUID is required" });
    }

    switch (fileType) {
        case 'accountVerify':
            const accountFile = await db.tblAccountDocument.findOne({
                where: { file_uuid: uuid }
            });


            if (!accountFile) {
                return ctx.fail({ code: 404, message: "File not found" });
            }

            const fileUserId = accountFile.user_id;

            // Check owner (1/2/3 role skip)
            if (ctx.session.user.role === 0) {
                if (ctx.session.user.id !== fileUserId) {
                    return ctx.fail({ code: 403, message: "You are not allowed to download this file" });
                }
            }

            const filePath = path.resolve(`./public/${fileType}/${uuid}.${accountFile.file_format}`);
            ctx.attachment(filePath);
            ctx.set('Content-Type', 'application/octet-stream');
            ctx.body = fs.createReadStream(filePath);
            break;
        case 'reportProof':
            const reportFile = await db.tblReportDocument.findOne({
                where: { file_uuid: uuid }
            });

            if (!reportFile) {
                return ctx.fail({ code: 404, message: "File not found" });
            }

            const fileUserId2 = reportFile.user_id;
            if (ctx.session.user.role === 0) {
                if (ctx.session.user.id !== fileUserId2) {
                    return ctx.fail({ code: 403, message: "You are not allowed to download this file" });
                }
            }

            const filePath2 = path.resolve(`./public/${fileType}/${uuid}.${reportFile.file_format}`);
            ctx.attachment(filePath2);
            ctx.set('Content-Type', 'application/octet-stream');
            ctx.body = fs.createReadStream(filePath2);
            break;
        default:
            ctx.fail({ code: 400, message: "Invalid file type" });
    }

}

export const _getReportRelatedFiles = async (reportId) => {
    const reportFiles = await db.tblReportDocument.findAll({
        attributes: ['id', 'file_uuid', 'file_format', 'document_type', 'original_name'],
        where: { report_id: reportId }
    });

    return reportFiles;
}


const unlinkFile = async (fileType, fileName) => {
    try {
        await fs.promises.unlink(`./public/${fileType}/${fileName}`);
        return true;
    } catch (error) {
        logger.error(error);
        return false;
    }
}