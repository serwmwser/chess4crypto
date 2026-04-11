// Пустая заглушка для @metamask/sdk
// Используется чтобы Vite не падал при импорте из зависимостей
export default {}
export const MetaMaskSDK = class {
  constructor() {}
  getProvider() { return null }
  connect() { return Promise.resolve(null) }
}