import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class tblOrder extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    marketplace_item_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'tbl_marketplace',
        key: 'id'
      }
    },
    seller_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'tbl_users',
        key: 'id'
      }
    },
    buyer_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'tbl_users',
        key: 'id'
      }
    },
    transaction_hash: {
      type: DataTypes.CHAR(64),
      allowNull: true
    },
    status: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 1,
      comment: "0: cancel 1: pending payment 2: payment success"
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    unit_price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    total: {
      type: DataTypes.DECIMAL,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'tbl_orders',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "tbl_orders_pk",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
