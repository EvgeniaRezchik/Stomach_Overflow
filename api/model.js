const db = require("./db").promise();

module.exports = class Model {
  constructor(table) {
    this.table = table;
  }
  findOne(value, column) {
    const query = "SELECT * FROM " + this.table + " WHERE "
		  + (column ? column:"id") + " = ?;";
    return db.query(query, !(!value && !column) ? value:-1)
    .then(res => {
      Object.assign(this, res[0][0]);
      return this;
    })
    .catch(err => {
      console.log(err);
      return null;
    });
  }
  static findAll(values, columns, params, orderBy, order,
	         limit, offset, joinTables,
	         joinColumns1, joinColumns2) {
    let query = `SELECT ${this.table}.* FROM ` + this.table;
    if (joinTables && joinColumns1 && joinColumns2) {
      if (joinTables instanceof Array
          && joinColumns1 instanceof Array && joinColumns2 instanceof Array) {
        for (let i = 0; i < joinTables.length; i += 1)
          query += " JOIN " + joinTables[i] + " ON "
		   + joinColumns1[i] + " = " + joinColumns2[i];
      } else
        query += " JOIN " + joinTables + " ON "
	         + joinColumns1 + " = " + joinColumns2;
    }
    let args = [];
    if (values) {
      query += " WHERE " + (columns ?
	                   (columns instanceof Array ? columns[0]:columns):
	                   "id") + " " + (params ?
				         (params instanceof Array ?
					  params[0]:params):"=") + " ";
      if (values instanceof Array) {
        if (!params || params === "=" || params === "LIKE"
	    || (params instanceof Array && (params[0] === "="
	    || params[0] === "LIKE"))) {
	  query += "?";
	  args.push(values[0]);
	} else if (params === "BETWEEN"
		 || (params instanceof Array && params[0] === "BETWEEN")) {
	  query += "?";
	  args.push(values[0][0]);
	  query += " AND ?";
	  args.push(values[0][1]);
	} else if (params === "IN"
		   || (params instanceof Array && params[0] === "IN")) {
	  query += "(?)";
	  args.push(values[0]);
	}
        for (let i = 1; i < values.length; i += 1) {
	  query += " AND ";
	  if (columns instanceof Array)
	    query += columns[i] + " ";
	  if (params instanceof Array
	      && (params[i] === "=" || params[i] === "LIKE")) {
	    query += params[i] + " ?";
	    args.push(values[i]);
	  } else if (params instanceof Array && params[i] === "BETWEEN") {
	    query += params[i] + " ?";
	    args.push(values[i][0]);
	    query += " AND ?";
	    args.push(values[i][1]);
	  } else if (params instanceof Array && params[i] === "IN") {
	    query += params[i] + " (?)";
	    args.push(values[i]);
	  }
	}
      } else {
        query += "?";
        args.push(values);
      }
    }
    if (orderBy)
      query += " ORDER BY " + orderBy + (order ? " " + order:"");
    if (limit)
      query += " LIMIT " + limit + (offset ? " OFFSET " + offset:"");
    query += ";";
    return db.query(query, args)
    .then(res => {return res[0];})
    .catch(err => {
      console.log(err);
      return null;
    });
  }
  delete() {
    return this.findOne(this.id)
    .then(res => {
      if (res) {
        return db.query(`DELETE FROM ${this.table} WHERE id = ?;`, this.id)
        .then(() => {return this.id;})
        .catch(err => {
	  console.log(err);
	  return null;
	});
      } else
        return null;
    })
    .catch(err => {
      console.log(err);
      return null;
    });
  }
  save() {
    let cpyObj = {};
    for (let i of Object.keys(this)) {
      if (i !== "table" && i !== "id"
          && (this[i] || typeof this[i] === "number" || typeof this[i] === "boolean" || this[i] === null))
        cpyObj[i] = this[i];
    }
    return db.query(`SELECT * FROM ${this.table} WHERE id = ?;`,
	            this.id ? this.id:-1)
    .then(res => {
      if (res[0].length !== 0) {
        return db.query(`UPDATE ${this.table} SET ? WHERE id = ?;`,
		        [cpyObj, this.id])
        .then(() => {return this.id;})
        .catch(err => {
	  console.log(err);
	  return null;
	});
      } else {
        let columns = [];
        let values = [];
        let questionMarks = "";
        for (let i of Object.keys(cpyObj)) {
	  columns.push(i);
	  values.push(cpyObj[i]);
	  if (questionMarks !== "")
	    questionMarks += ", ";
	  questionMarks += "?";
	}
        const query = "INSERT INTO " + this.table + " (" + columns.join(", ")
		      + ") VALUES (" + questionMarks + ");";
        return db.query(query, values)
        .then(obj => {
	  return this.findOne(obj[0].insertId)
	  .then(() => {return this.id;})
	  .catch(err => {
	    console.log(err);
	    return null;
	  });
	})
        .catch(err => {
	  console.log(err);
	  return null;
	});
      }
    })
    .catch(err => {
      console.log(err);
      return null;
    });
  }
}

