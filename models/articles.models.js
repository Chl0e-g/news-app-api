const db = require("../db/connection");

exports.fetchArticleById = async (articleId) => {
  const {
    rows: [article],
  } = await db.query(
    `
    SELECT articles.*, COUNT(comments.comment_id)::int AS comment_count
    FROM articles
    LEFT JOIN comments ON articles.article_id = comments.article_id
    WHERE articles.article_id = $1
    GROUP BY articles.article_id;`,
    [articleId]
  );

  //error handling: no article found
  if (!article) {
    return Promise.reject({ status: 404, msg: "Article ID not found" });
  }

  return article;
};

exports.updateArticleVotes = async (articleId, incVotes) => {
  //error handling: no incVotes
  if (!incVotes) {
    return Promise.reject({
      status: 400,
      msg: "Missing inc_votes data in request body",
    });
  }

  //error handling: invalid incVotes
  if (!Number.isInteger(incVotes)) {
    return Promise.reject({
      status: 400,
      msg: "Invalid inc_votes data in request body",
    });
  }

  const {
    rows: [updatedArticle],
  } = await db.query(
    `
    UPDATE articles
    SET votes = votes + $2
    WHERE article_id = $1
    RETURNING *;`,
    [articleId, incVotes]
  );

  //error handling: no article found
  if (!updatedArticle) {
    return Promise.reject({ status: 404, msg: "Article ID not found" });
  }

  return updatedArticle;
};

exports.fetchArticles = async (sortBy = "created_at", order = "desc") => {
  //error handling: invalid sortBy query
  const validSortByColumns = [
    "author",
    "title",
    "article_id",
    "topic",
    "created_at",
    "votes",
  ];
  if (!validSortByColumns.includes(sortBy)) {
    return Promise.reject({ status: 400, msg: "Invalid sort_by query" });
  }

  //error handling: invalid order query
  const validOrders = ["asc", "desc"];
  if (!validOrders.includes(order)) {
    return Promise.reject({ status: 400, msg: "Invalid order query" });
  }

  const { rows: articles } = await db.query(`
  SELECT 
  articles.author, articles.title, articles.article_id, articles.topic, articles.created_at, articles.votes, COUNT(comments.comment_id)::int AS comment_count
  FROM articles
  LEFT JOIN comments ON articles.article_id = comments.article_id
  GROUP BY articles.article_id
  ORDER BY ${sortBy} ${order};`);
  return articles;
};
