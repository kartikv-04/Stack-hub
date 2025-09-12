export interface User {
    _id? : string,
    email : string,
    password : string,
    refreshToken? : string | null,
    createdAt? : boolean,
    updatedAt? : boolean

}

export interface Authpayload {
    email : string,
    password : string
}