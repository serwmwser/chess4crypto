// ============================================================================
// ЗАГЛУШКА ДЛЯ @metamask/sdk
// Минимальный набор экспортов для совместимости с wagmi/connectors
// ============================================================================

// ✅ EventType — то, что импортирует @wagmi/connectors
export const EventType = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ACCOUNTS_CHANGED: 'accountsChanged',
  CHAIN_CHANGED: 'chainChanged',
  MESSAGE: 'message',
  ERROR: 'error'
}

// ✅ ProviderType
export const ProviderType = {
  MetaMask: 'metamask',
  MetaMaskSDK: 'metamask_sdk'
}

// ✅ SDKProvider — заглушка провайдера
export class SDKProvider {
  constructor() {
    this.isMetaMask = true
  }
  async request() { return null }
  on() { return this }
  removeListener() { return this }
}

// ✅ MetaMaskSDK — главный класс
export class MetaMaskSDK {
  constructor() {
    this._provider = new SDKProvider()
  }
  async init() { return this }
  async connect() { return { provider: this._provider } }
  getProvider() { return this._provider }
  terminate() { return Promise.resolve() }
  on() { return this }
  off() { return this }
}

// ✅ Экспорт по умолчанию
export default MetaMaskSDK

// ✅ Дополнительные экспорты для совместимости
export const createProvider = () => new SDKProvider()
export const getSdk = () => new MetaMaskSDK()
export const disconnect = () => Promise.resolve(true)
export const reconnect = () => Promise.resolve(null)