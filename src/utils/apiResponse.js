class apiResponse {
    constructor(statusCode, message = "", data = ""){
        this.message = message,
        this.data = data,
        this.statusCode = statusCode
    }
}
export { apiResponse }