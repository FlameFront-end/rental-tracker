import { useConfirmContext } from './confirm.context'

export const useConfirm = () => useConfirmContext().confirm
