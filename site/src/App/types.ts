import User from "logic/User"

export type UserContextType = [OptionalUser, SetNullableUser]
export type SetNullableUser = (user: OptionalUser) => void
export type OptionalUser    = User | undefined