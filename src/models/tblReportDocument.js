import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class tblReportDocument extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'tbl_users',
        key: 'id'
      }
    },
    file_uuid: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    file_format: {
      type: DataTypes.STRING(5),
      allowNull: false
    },
    document_type: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    report_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'tbl_reports',
        key: 'id'
      }
    },
    original_name: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tbl_report_documents',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "tbl_report_documents_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
