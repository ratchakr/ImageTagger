var uuid = require("uuid");
var db = require("../upload").bucket;
var config = require("../config");
var N1qlQuery = require('couchbase').N1qlQuery;

function ImageModel() { };

/*
 * Delete a document from Couchbase Server by document id
 */
ImageModel.delete = function(documentId, callback) {
    db.remove(documentId, function(error, result) {
        if(error) {
            callback(error, null);
            return;
        }
        callback(null, {message: "success", data: result});
    });
};

/*
 * Save a document.  If a document id is not provided an insert will happen, otherwise update.  Thus an upsert.
 */
ImageModel.save = function(data, callback) {
    console.log("data passed to cb", data);
    var jsonObject = {
        filename: data.filename,
        likes: data.likes,
        tags: data.tags
    }
    // If the document id doesn't exist create a unique id for inserting
    var documentId = data.id ? data.id : uuid.v4();
    db.upsert(documentId, jsonObject, function(error, result) {
        if(error) {
            callback(error, null);
            return;
        }
        callback(null, {message: "success", data: result});
    });
    //console.log("data saved to cb", data);
}

/*
 * Get a particular document from Couchbase Server using a parameterized N1QL query
 */
ImageModel.getByDocumentId = function(documentId, callback) {
    var statement = "SELECT META(photos).id, filename, likes, tags " +
                    "FROM `" + config.couchbase.bucket + "` AS photos " +
                    "WHERE META(photos).id = $1";
    var query = N1qlQuery.fromString(statement);
    console.log("query : ", documentId);
    db.query(query, [documentId], function(error, result) {
        if(error) {
            return callback(error, null);
        }
        callback(null, result);
    });
};

/*
 * Get all documents from Couchbase Server using N1QL
 */
ImageModel.getAll = function(callback) {
    var statement = "SELECT META(photos).id, filename, likes, tags " +
                    "FROM `" + config.couchbase.bucket + "` AS photos";
    var query = N1qlQuery.fromString(statement).consistency(N1qlQuery.Consistency.REQUEST_PLUS);
    db.query(query, function(error, result) {
        if(error) {
            return callback(error, null);
        }
        callback(null, result);
    });
};

/*
 * Get all documents by a particular tag from Couchbase Server using N1QL
 */
ImageModel.getImagesByTag = function(tagName, callback) {
    console.log("getImagesByTag : ", tagName);
    var statement = "SELECT META(photos).id, filename, likes, tags " +
                    "FROM `" + config.couchbase.bucket + "` AS photos WHERE $1 IN tags";
                    //tagName + "IN tags";
    var query = N1qlQuery.fromString(statement);
    db.query(query, [tagName], function(error, result) {
        if(error) {
            return callback(error, null);
        }
        callback(null, result);
    });
};

module.exports = ImageModel;
