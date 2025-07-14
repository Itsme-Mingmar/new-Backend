class apierror extends Error{
    constructor(statusCode, message = "", errors = [], stack = ""){
        super(message),
        this.statusCode = statusCode,
        this.errors = errors,
        this.data = null,
        this.success = false,
        this.message = message
    }
}
 export {apierror}