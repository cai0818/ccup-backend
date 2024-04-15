import _sequelize from "sequelize";
const DataTypes = _sequelize.DataTypes;
import _tblAccountDocument from  "./tblAccountDocument.js";
import _tblAccountVerifyRequest from  "./tblAccountVerifyRequest.js";
import _tblAnnualQuotaLog from  "./tblAnnualQuotaLog.js";
import _tblMarketplace from  "./tblMarketplace.js";
import _tblOrder from  "./tblOrder.js";
import _tblReportDocument from  "./tblReportDocument.js";
import _tblReportTemplate from  "./tblReportTemplate.js";
import _tblReport from  "./tblReport.js";
import _tblTransaction from  "./tblTransaction.js";
import _tblUser from  "./tblUser.js";
import _tblWallet from  "./tblWallet.js";

export default function initModels(sequelize) {
  const tblAccountDocument = _tblAccountDocument.init(sequelize, DataTypes);
  const tblAccountVerifyRequest = _tblAccountVerifyRequest.init(sequelize, DataTypes);
  const tblAnnualQuotaLog = _tblAnnualQuotaLog.init(sequelize, DataTypes);
  const tblMarketplace = _tblMarketplace.init(sequelize, DataTypes);
  const tblOrder = _tblOrder.init(sequelize, DataTypes);
  const tblReportDocument = _tblReportDocument.init(sequelize, DataTypes);
  const tblReportTemplate = _tblReportTemplate.init(sequelize, DataTypes);
  const tblReport = _tblReport.init(sequelize, DataTypes);
  const tblTransaction = _tblTransaction.init(sequelize, DataTypes);
  const tblUser = _tblUser.init(sequelize, DataTypes);
  const tblWallet = _tblWallet.init(sequelize, DataTypes);

  tblOrder.belongsTo(tblMarketplace, { as: "marketplace_item", foreignKey: "marketplace_item_id"});
  tblMarketplace.hasMany(tblOrder, { as: "tbl_orders", foreignKey: "marketplace_item_id"});
  tblReport.belongsTo(tblReportTemplate, { as: "template", foreignKey: "template_id"});
  tblReportTemplate.hasMany(tblReport, { as: "tbl_reports", foreignKey: "template_id"});
  tblReportDocument.belongsTo(tblReport, { as: "report", foreignKey: "report_id"});
  tblReport.hasMany(tblReportDocument, { as: "tbl_report_documents", foreignKey: "report_id"});
  tblAccountDocument.belongsTo(tblUser, { as: "user", foreignKey: "user_id"});
  tblUser.hasMany(tblAccountDocument, { as: "tbl_account_documents", foreignKey: "user_id"});
  tblAccountVerifyRequest.belongsTo(tblUser, { as: "user", foreignKey: "user_id"});
  tblUser.hasMany(tblAccountVerifyRequest, { as: "tbl_account_verify_requests", foreignKey: "user_id"});
  tblAnnualQuotaLog.belongsTo(tblUser, { as: "user", foreignKey: "user_id"});
  tblUser.hasMany(tblAnnualQuotaLog, { as: "tbl_annual_quota_logs", foreignKey: "user_id"});
  tblMarketplace.belongsTo(tblUser, { as: "user", foreignKey: "user_id"});
  tblUser.hasMany(tblMarketplace, { as: "tbl_marketplaces", foreignKey: "user_id"});
  tblOrder.belongsTo(tblUser, { as: "seller", foreignKey: "seller_id"});
  tblUser.hasMany(tblOrder, { as: "tbl_orders", foreignKey: "seller_id"});
  tblOrder.belongsTo(tblUser, { as: "buyer", foreignKey: "buyer_id"});
  tblUser.hasMany(tblOrder, { as: "buyer_tbl_orders", foreignKey: "buyer_id"});
  tblReportDocument.belongsTo(tblUser, { as: "user", foreignKey: "user_id"});
  tblUser.hasMany(tblReportDocument, { as: "tbl_report_documents", foreignKey: "user_id"});
  tblReport.belongsTo(tblUser, { as: "user", foreignKey: "user_id"});
  tblUser.hasMany(tblReport, { as: "tbl_reports", foreignKey: "user_id"});
  tblReport.belongsTo(tblUser, { as: "approve_by_tbl_user", foreignKey: "approve_by"});
  tblUser.hasMany(tblReport, { as: "approve_by_tbl_reports", foreignKey: "approve_by"});
  tblWallet.belongsTo(tblUser, { as: "user", foreignKey: "user_id"});
  tblUser.hasOne(tblWallet, { as: "tbl_wallet", foreignKey: "user_id"});

  return {
    tblAccountDocument,
    tblAccountVerifyRequest,
    tblAnnualQuotaLog,
    tblMarketplace,
    tblOrder,
    tblReportDocument,
    tblReportTemplate,
    tblReport,
    tblTransaction,
    tblUser,
    tblWallet,
  };
}
