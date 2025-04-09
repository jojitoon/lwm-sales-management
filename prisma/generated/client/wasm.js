
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.5.0
 * Query Engine version: 173f8d54f8d52e692c7e27e72a88314ec7aeff60
 */
Prisma.prismaVersion = {
  client: "6.5.0",
  engine: "173f8d54f8d52e692c7e27e72a88314ec7aeff60"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  name: 'name',
  isAdmin: 'isAdmin',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  identifier: 'identifier',
  token: 'token',
  expires: 'expires'
};

exports.Prisma.SettingScalarFieldEnum = {
  id: 'id',
  currentSession: 'currentSession',
  adminPassword: 'adminPassword',
  mainStoreData: 'mainStoreData'
};

exports.Prisma.PreOrderScalarFieldEnum = {
  id: 'id',
  orderNumber: 'orderNumber',
  fullName: 'fullName',
  email: 'email',
  phoneNumber: 'phoneNumber',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  isCollected: 'isCollected',
  isPartiallyCollected: 'isPartiallyCollected',
  purchasedAt: 'purchasedAt',
  shippingZone: 'shippingZone',
  orderStatus: 'orderStatus',
  total: 'total'
};

exports.Prisma.OrderItemScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  quantity: 'quantity',
  price: 'price',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  isCollected: 'isCollected',
  productName: 'productName',
  bookId: 'bookId',
  consolidationId: 'consolidationId'
};

exports.Prisma.ConsolidationScalarFieldEnum = {
  id: 'id',
  date: 'date',
  session: 'session',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  orderId: 'orderId'
};

exports.Prisma.PreorderSessionScalarFieldEnum = {
  id: 'id',
  session: 'session',
  userId: 'userId',
  data: 'data',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TableSaleSessionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  tableId: 'tableId',
  session: 'session',
  managerId: 'managerId',
  salesPersonId: 'salesPersonId',
  data: 'data',
  soldData: 'soldData',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MySessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  session: 'session',
  workspace: 'workspace',
  data: 'data',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tableSaleSessionId: 'tableSaleSessionId',
  miniStoreSessionId: 'miniStoreSessionId',
  mainStoreSessionId: 'mainStoreSessionId',
  preorderSessionId: 'preorderSessionId'
};

exports.Prisma.MiniStoreSessionScalarFieldEnum = {
  id: 'id',
  session: 'session',
  managerId: 'managerId',
  collectedData: 'collectedData',
  distributedData: 'distributedData',
  data: 'data',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MainStoreSessionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  session: 'session',
  managerId: 'managerId',
  collectedData: 'collectedData',
  distributedData: 'distributedData',
  data: 'data',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MainStoreRequestScalarFieldEnum = {
  id: 'id',
  mainStoreSessionId: 'mainStoreSessionId',
  miniStoreSessionId: 'miniStoreSessionId',
  request: 'request',
  granted: 'granted',
  wasDenied: 'wasDenied',
  wasApproved: 'wasApproved',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MiniStoreRequestScalarFieldEnum = {
  id: 'id',
  miniStoreSessionId: 'miniStoreSessionId',
  tableSaleSessionId: 'tableSaleSessionId',
  preorderSessionId: 'preorderSessionId',
  request: 'request',
  granted: 'granted',
  wasDenied: 'wasDenied',
  wasApproved: 'wasApproved',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BookScalarFieldEnum = {
  id: 'id',
  title: 'title',
  total: 'total',
  available: 'available',
  preorderTotal: 'preorderTotal',
  preorderAvailable: 'preorderAvailable',
  salesTotal: 'salesTotal',
  salesAvailable: 'salesAvailable',
  price: 'price',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BookSaleScalarFieldEnum = {
  id: 'id',
  orderNumber: 'orderNumber',
  fullName: 'fullName',
  email: 'email',
  phoneNumber: 'phoneNumber',
  isPaid: 'isPaid',
  purchasedAt: 'purchasedAt',
  orderStatus: 'orderStatus',
  total: 'total',
  sessionId: 'sessionId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BookSaleItemScalarFieldEnum = {
  id: 'id',
  bookSaleId: 'bookSaleId',
  bookId: 'bookId',
  quantity: 'quantity',
  price: 'price',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};


exports.Prisma.ModelName = {
  User: 'User',
  Account: 'Account',
  Session: 'Session',
  VerificationToken: 'VerificationToken',
  Setting: 'Setting',
  PreOrder: 'PreOrder',
  OrderItem: 'OrderItem',
  Consolidation: 'Consolidation',
  PreorderSession: 'PreorderSession',
  TableSaleSession: 'TableSaleSession',
  MySession: 'MySession',
  MiniStoreSession: 'MiniStoreSession',
  MainStoreSession: 'MainStoreSession',
  MainStoreRequest: 'MainStoreRequest',
  MiniStoreRequest: 'MiniStoreRequest',
  Book: 'Book',
  BookSale: 'BookSale',
  BookSaleItem: 'BookSaleItem'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
