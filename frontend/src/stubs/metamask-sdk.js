// ============================================================================
// ЗАГЛУШКА ДЛЯ @metamask/sdk
// Используется чтобы Vite/Netlify успешно собирали проект без реального пакета
// ============================================================================

// ✅ EventType — то, что импортирует @wagmi/connectors
export const EventType = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ACCOUNTS_CHANGED: 'accountsChanged',
  CHAIN_CHANGED: 'chainChanged',
  MESSAGE: 'message',
  ERROR: 'error',
  PROVIDER_CHANGED: 'provider_changed',
  SDK_READY: 'sdk_ready'
}

// ✅ ProviderType
export const ProviderType = {
  MetaMask: 'metamask',
  MetaMaskSDK: 'metamask_sdk',
  Injected: 'injected'
}

// ✅ SDKProvider — заглушка провайдера
export class SDKProvider {
  constructor(options = {}) {
    this.options = options
    this.chainId = null
    this.accounts = []
    this.isMetaMask = true
  }

  async request({ method, params }) {
    // Возвращаем безопасные заглушки для популярных RPC-методов
    switch (method) {
      case 'eth_chainId':
        return '0x1' // Mainnet
      case 'eth_accounts':
      case 'eth_requestAccounts':
        return []
      case 'net_version':
        return '1'
      case 'wallet_switchEthereumChain':
        return null
      default:
        return null
    }
  }

  on(event, listener) { return this }
  removeListener(event, listener) { return this }
  removeAllListeners(event) { return this }
  emit(event, ...args) { return true }
}

// ✅ MetaMaskSDK — главный класс
export class MetaMaskSDK {
  constructor(options = {}) {
    this.options = options
    this._provider = new SDKProvider(options)
    this._connected = false
  }

  async init() {
    return this
  }

  async connect() {
    this._connected = true
    return { provider: this._provider, accounts: [] }
  }

  async disconnect() {
    this._connected = false
    return true
  }

  getProvider() {
    return this._provider
  }

  isConnected() {
    return this._connected
  }

  terminate() {
    return Promise.resolve()
  }

  updateOptions(options) {
    this.options = { ...this.options, ...options }
  }

  // ✅ События — заглушки
  on(event, handler) { return this }
  off(event, handler) { return this }
}

// ✅ Экспорт по умолчанию
export default MetaMaskSDK

// ✅ Дополнительные экспорты для совместимости
export const createProvider = (options) => new SDKProvider(options)
export const getSdk = (options) => new MetaMaskSDK(options)
export const disconnect = () => Promise.resolve(true)
export const reconnect = () => Promise.resolve(null)
export const terminate = () => Promise.resolve(true)

// ✅ Пустые функции для любых других импортов
export const init = () => Promise.resolve(new MetaMaskSDK())
export const connect = () => Promise.resolve({ provider: new SDKProvider() })
export const request = () => Promise.resolve(null)
export const on = () => {}
export const off = () => {}