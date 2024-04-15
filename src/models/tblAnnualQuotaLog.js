import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class tblAnnualQuotaLog extends Model {
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
    annual: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    claimed_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'tbl_annual_quota_logs',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "tbl_annual_quota_logs_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
