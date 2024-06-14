const productModel = require("../../models/productModel")

const deleteProductController = async(req,res)=>{
    try{
        const {id} = req.body
        const deleteDoc = await productModel.findByIdAndDelete({_id:id})

        res.json({
            message : "Product Deleted Successfully",
            success : true,
            error : false,
        })

    }catch(err){
        res.status(400).json({
            message : err.message || err,
            error : true,
            success : false
        })
    }

}

module.exports = deleteProductController