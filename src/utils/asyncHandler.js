const asyncHandler = (fn) => 
    async (req, res, next) =>{
        try{
            await fn(req, res, next);
        }
        catch(error) {
             console.error("Caught error:", error);
            const statusCode = error.status || 500 
            res.status(statusCode).json({
                success: false,
                message: error.message
            });
        }
    }
export { asyncHandler }