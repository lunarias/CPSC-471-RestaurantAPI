// When controller receives a call, it will check the model and run these sql queries
const sql = require("./db.js");
const Order = require("./order.model.js");

// constructor
const Membership = function (membership) {
      this.cardId = membership.cardId;
      this.tier = membership.tierId;
      this.points = membership.points;
      this.lastUsed = membership.lastUsed;
      this.customerId = membership.customerId;
};

// creates a member entry in the membership table
Membership.create = (newMember, result) => {
      sql.query("INSERT INTO membership SET ?", newMember, (err, res) => {
            if (err) {
                  console.log("error: ", err);
                  result(err, null);
                  return;
            }
            cardId = res.insertId
            console.log("created membership: ", { id: cardId, ...newMember });
            result(null, { id: cardId, ...newMember });
      });
};

// retrieves all membership entries
Membership.getAll = result => {
      sql.query("SELECT * FROM membership", (err, res) => {
            if (err) {
                  console.log("error: ", err);
                  result(null, err);
                  return;
            }
            console.log("Members: ", res);
            result(null, res);
      });
};


// retrieves a member with the given id and all their orders as "transactions"
Membership.findById = (memberId, result) => {
      sql.query(`SELECT * FROM membership WHERE cardId = ${memberId}`, (err, res) => {
            if (err) {
                  console.log("error: ", err);
                  result(err, null);
                  return;
            }
            // if the member exists (response contains something)
            if (res.length) {
                  let thisMember = res[0]
                  // get list of transactions from this card
                  // query from order to get all orders from this customer
                  // return an object
                  Order.getAllOrdersByCustomer(thisMember.customerId,(err,data) => {
                        if (err) {
                              console.log("error in retrieving customer orders: ", err);
                              result(err, null);
                              return;
                        }   
                        // include it in the response
                        thisMember.transactions = [...data];     
                        console.log("found member: ", thisMember);
                        result(null, thisMember);                           
                  });
                  return;
            }
            // not found Membership with the id
            result({ kind: "not_found" }, null);
      });
};

// update the member with the given id
Membership.updateById = (cardId, member, result) => {

      // for those values that should be left unchanged (it wasn't included in the paramters)
      // they are left null and left unchanged when calling the stored procedure
      tier = null;
      points = null;
      lastUsed = null;
      if ("tier" in member) {
            tier = member.tier;
      }
      if ("points" in member) {
            points = member.points;
      } 
      if ("lastUsed" in member) {
            lastUsed = member.lastUsed;
      }
      // call the stored procedure
      sql.query(
        "call restaurantdb.updateMember(?, ?, ?, ?);", [cardId, tier, points, lastUsed],     
        (err, res) => {
          if (err) {
            console.log("error: ", err);
            result(null, err);
            return;
          }
          // no rows were affected, meaning the member wasn't found
          if (res.affectedRows == 0) {
            // not found Membership with the id
            result({ kind: "not_found" }, null);
            return;
          }
    
          console.log("updated member: ", { cardId: cardId, ...member });
          result(null, { cardId: cardId, ...member });
        }
      );
    };
    

// permanently delete a member with the given id
Membership.remove = (id, result) => {
      sql.query("DELETE FROM membership WHERE cardId = ?", id, (err, res) => {
        if (err) {
          console.log("error: ", err);
          result(null, err);
          return;
        }
    
        if (res.affectedRows == 0) {
          // not found Membership with the id
          result({ kind: "not_found" }, null);
          return;
        }
    
        console.log("deleted member with cardId: ", id);
        result(null, res);
      });
    };

// permanently deletes all membership records in the database
Membership.removeAll = result => {
      sql.query("DELETE FROM membership", (err, res) => {
            if (err) {
                  console.log("error: ", err);
                  result(null, err);
                  return;
            }

            console.log(`deleted ${res.affectedRows} members`);
            result(null, res);
      });
};

module.exports = Membership;