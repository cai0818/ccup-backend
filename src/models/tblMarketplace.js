import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class tblMarketplace extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbl_users',
        key: 'id'
      }
    },
    trade_type: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      comment: "1: sell 2: requestBuy"
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    unit_price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    status: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 1,
      comment: "1: available 2: locked 3: finished"
    }
  }, {
    sequelize,
    tableName: 'tbl_marketplace',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "tbl_marketplace_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
