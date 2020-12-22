const redis = require('redis');
const { promisify } = require("util");

const defaultItems = require('./default_shopping_items');

const io = require('./socket');

const host = process.env.DB_HOST;
const port = process.env.DB_PORT;
console.log('db host: ', host, ', port: ', port);

let client;
// let client = redis.createClient({
//   host: 'redis-server',
//   port: 6379
// });
if (host && port) {
  console.log('Connect using db host: ', host, ', port: ', port);
  client = redis.createClient({
    host,
    port,
  });
} else if (host) {
  console.log('Connect using db host: ', host);
  client = redis.createClient({
    host,
  });
} else {
  console.log('Connect using default redis values');
  client = redis.createClient();
}
console.log('Created an redis client for host ', host);

client.on("error", function(error) {
  console.error('A redis error occured: ', error);
});

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);
const keyAsync = promisify(client.keys).bind(client);
const scanAsync = promisify(client.scan).bind(client);

const getAllItems = async (key) => {
  return getAllValues();
}

const getItem = async (key) => {
  return getKey(key);
}

const addItem = async (key, value) => {
  await setKey(key, value);

  //watch changes to the new item
  // await watchKeyChanges(key);

  //send event to clients
  io.getIO().emit("change", { action: "add", key, value });
}

const updateItem = async (key, value) => {
  io.getIO().emit("change", { action: "update", key, value });
  return setKey(key, value);
}

const deleteItem = async (key) => {
  io.getIO().emit("change", { action: "delete", key });
  return deleteKey(key);
}

const getAllKeys = async () => {
  console.log("get all keys...");

  // result = await keyAsync("*");

  let allKeys = [];

  let next;
  let keys;
  do {
    result = await scanAsync("0");
    next = result[0];
    keys = result[1];
    console.log("scan returns ", next, " and keys ", keys);
    allKeys = [...allKeys, result[1]];
  } while (next !== "0");

  console.log("all keys:", result[1]);
  return result[1];
};

const getAllValues = async () => {
  console.log("get all keys-values...");

  const keys = await getAllKeys();
  // console.log("keys are ", keys);

  let allValues = [];

  for (key of keys) {
    const val = await getKey(key);
    allValues.push({ item: key, qty: val });
  }

  console.log("all keys-values:", allValues);
  return allValues;
};

const getKey = async (key) => {
  console.log('get key ', key);
  const val = await getAsync(key);
  console.log(key, ' is ', val);
  return val;
}

const setKey = async (key, value) => {
  console.log('set ', key, ' to ', value);    
  const res = await setAsync(key, value);
  return res;
}

const deleteKey = async (key) => {
    console.log('delete ', key);    
    const res = await delAsync(key);
    // console.log('delete ', key, ' => ', res);
    return res;
}

const initWatchers = async () => {
  console.log('Init watchers....');

  const keys = await getAllKeys();

  try {
    for (key of keys) {
      watchKeyChanges(key);
    }
  } catch (err) { 
    console.error("An error occured while initialize etcd watchers: ", err);
  }

}

const initDB = async () => {
  console.log("Init DB....");

  if (!defaultItems || defaultItems.length === 0) {
    return;
  }

  let val;
  try {
    for (item of defaultItems) {
      console.log(item);
      val = await getKey(item.itemName);
      if (!val) {
        // addItem(item.itemName, item.itemQty);
        await setKey(item.itemName, item.itemQty);
      }
    }
  } catch (err) {
    console.error("An error occured while initialize redis db: ", err);
  }

  // await initWatchers();

  io.getIO().emit("change", { action: "init" });
};


const watchKeyChanges = (key) => {
    console.log('Watch changes for ', key);
    client
      .watch()
      .key(key)
      .create()
      .then((watcher) => {
        watcher
          .on("disconnected", () => 
            console.log("watcher disconnected...")
            )
          .on("connected", () =>
            console.log("successfully reconnected watcher!")
          )
          .on("put", (res) => {
            let value = res.value.toString();
            console.log('PUT EVENT - ', key, " got set to:", value);
            //emit event
            io.getIO().emit("change", { action: "update", key, value });
          })
          .on("delete", (res) => { 
              console.log('DELETE EVENT - ', key, " was deleted");
              //emit event
            io.getIO().emit("change", { action: "delete", key, value: null });
        });
      });
}

module.exports = {
    initDB,
    getAllItems,
    getItem,
    addItem,
    updateItem,
    deleteItem,
    // getAllKeys,
    // getAllValues,
    // getKey,
    // setKey,
    // deleteKey
}

// (async () => {
//   await client.put('foo').value('bar');

//   await client.put('msg2').value('test msg2');
 
//   const fooValue = await client.get('foo').string();
//   console.log('foo was:', fooValue);
 
//   const allFValues = await client.getAll().prefix('f').keys();
//   console.log('all our keys starting with "f":', allFValues);

//   const allFValues2 = await client.getAll().keys();
//   console.log('all our keys:', allFValues2);

//   const allFValues2Str = await client.getAll().strings();
//   console.log('all our keys as text:', allFValues2Str);

//   const allFValues2Json = await client.getAll().json;
//   console.log('all our keys as JSON:', allFValues2Json);
 
// //   await client.delete().all();
// })();

// getKey('aaaa');
// initDB();
