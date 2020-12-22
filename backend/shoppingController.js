const db = require('./dbController');

const getShopppingList = async (req, res, next) => {
    console.log('Get shopping list...');

    try {
      // db.getAllItems().then( result => {
      //   console.log('Controller - all items: ', result);
      //   // return res.json(result);
      //   return res.render("shopping/main", {
      //     items: result,
      //     pageTitle: "Shopping list",
      //     errorMsg: null 
      //   });
      // });
      
      const result = await db.getAllItems();
      // return res.json(result);
      return res.render("shopping/main", {
        items: result,
        pageTitle: "Shopping list",
        errorMsg: null 
      });
    } catch (err) {
        const error = new Error("Could not retrieve the shopping list");
        error.statusCode = 500;
        return next(error);
    }
}

const addShopppingItem = async (req, res, next) => { 
    const item = req.body.item;
    const qty = req.body.qty;
    console.log('Add item ', item, ' quantity ', qty);

    try {
      //check if item already exists
      const val = await db.getItem(item);
      if (val) {
        console.log("Item ", item, " is already in list.");
        const error = new Error("Item " + item + " is already in list.");
        error.statusCode = 400;
        return next(error);
        // return res.redirect("/");
      }

      await db.addItem(item, qty);

      res.redirect("/");
    } catch (err) {
      const error = new Error("Could not add the item");
      error.statusCode = 500;
      return next(error);
    } 
}

const decQtyShopppingItem = async (req, res, next) => {
    // console.log('Params ', req.params);
    const item = req.body.item;  //req.params.item;
    console.log('Decrement quantity item ', item);

    if (!item) {
      const error = new Error("Invalid item");
      error.statusCode = 400;
      return next(error);
    }

    try {
      const val = await db.getItem(item);
      const qty = Number.parseInt(val);

      if (qty >= 2) {
        await db.updateItem(item, qty - 1);
      } else {
        //Qty is 1 so the item can be removed
        await db.deleteItem(item);
      }

      res.redirect('/');
      // await getShopppingList(req, res, next);
    } catch (err) {
      const error = new Error("Could not chnage the quantity");
      error.statusCode = 400;
      return next(error);
    }
    
}

const incQtyShopppingItem = async (req, res, next) => {
    // console.log('Params ', req.params);
    const item = req.body.item;   //req.params.item;
    console.log('Increment quantity item ', item);

    if (!item) {
      const error = new Error("Invalid item");
      error.statusCode = 400;
      return next(error);
    }

    try {
      const val = await db.getItem(item);
      const qty = Number.parseInt(val);

      if (qty < 100) {
        await db.updateItem(item, qty + 1);

        res.redirect('/');
        // await getShopppingList(req, res, next);
      } else {
        //Qty is 100. throw an error
        const error = new Error("Quantity cannot be bigger than 100");
        error.statusCode = 400;
        return next(error);
        // throw new Error('Quantity cannot be bigger than 100');
      }
    } catch (err) {
      const error = new Error("Could not chnage the quantity");
      error.statusCode = 400;
      return next(error);
    }
    
}

const deleteShopppingItem = async (req, res, next) => {
    // console.log('Params ', req.params);
    const item = req.body.item;       //req.params.item;
    console.log('Delete item ', item);

    if (!item) {
      const error = new Error("Invalid item");
      error.statusCode = 400;
      return next(error);
    }

    try {
      await db.deleteItem(item);

      res.redirect("/");
    } catch (err) {
      const error = new Error("Could not chnage the quantity");
      error.statusCode = 400;
      return next(error);
    }
}

module.exports = {
    getShopppingList,
    addShopppingItem,
    decQtyShopppingItem,
    incQtyShopppingItem,
    deleteShopppingItem
}