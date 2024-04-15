import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class tblReport extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    uuid: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'tbl_users',
        key: 'id'
      }
    },
    template_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'tbl_report_templates',
        key: 'id'
      }
    },
    annual: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0,
      comment: "0: 已创建 1: 已提交 2: 已拒绝 3: 已通过"
    },
    report_data: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    created_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    reject_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    nft_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    transaction_hash: {
      type: DataTypes.CHAR(64),
      allowNull: true
    },
    approve_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'tbl_users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'tbl_reports',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "tbl_reports_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "tbl_reports_uuid_index",
        fields: [
          { name: "uuid" },
        ]
      },
    ]
  });
  }
}
