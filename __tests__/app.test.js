const request = require("supertest");
const app = require("../app");
const seed = require("../db/seeds/seed");
const data = require("../db/data/test-data");
const db = require("../db/connection");

afterAll(() => db.end());
beforeEach(() => seed(data));

describe("Invalid endpoint error", () => {
  test("status: 404 - msg 'Path not found' for invalid endpoint", () => {
    return request(app)
      .get("/api/invalid-path")
      .expect(404)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("Path not found");
      });
  });
});

describe("/api/topics", () => {
  describe("GET", () => {
    test("status: 200 - responds with an array of topic objects", () => {
      return request(app)
        .get("/api/topics")
        .expect(200)
        .then(({ body: { topics } }) => {
          expect(Array.isArray(topics)).toBe(true);
          expect(topics).toHaveLength(3);
        });
    });
    test("status: 200 - topic objects in response have 'slug' and 'description' properties with string values", () => {
      return request(app)
        .get("/api/topics")
        .expect(200)
        .then(({ body: { topics } }) => {
          topics.forEach((topic) => {
            expect(topic).toEqual(
              expect.objectContaining({
                slug: expect.any(String),
                description: expect.any(String),
              })
            );
          });
        });
    });
  });
});

describe("/api/articles/:article_id", () => {
  describe("GET", () => {
    test("status: 200 - responds with a single article object with matching article_id", () => {
      return request(app)
        .get("/api/articles/1")
        .expect(200)
        .then(({ body: { article } }) => {
          expect(typeof article).toBe("object");
          expect(article.article_id).toBe(1);
        });
    });
    test("status: 200 - article object in response has these properties: author, title, article_id, body, topic, created_at, votes", () => {
      const article1 = {
        article_id: 1,
        title: "Living in the shadow of a great man",
        topic: "mitch",
        author: "butter_bridge",
        body: "I find this existence challenging",
        created_at: expect.any(String),
        votes: 100,
        comment_count: 11,
      };
      return request(app)
        .get("/api/articles/1")
        .expect(200)
        .then(({ body: { article } }) => {
          expect(article).toEqual(article1);
        });
    });
    test("status: 200 - article object in response has comment_count property equal to the number of comments associated with that article_id", () => {
      return request(app)
        .get("/api/articles/1")
        .expect(200)
        .then(({ body: { article } }) => {
          expect(article.comment_count).toBe(11);
        });
    });
    test("status: 200 - comment_count property is equal to zero if no comments are associated with that article_id", () => {
      return request(app)
        .get("/api/articles/2")
        .expect(200)
        .then(({ body: { article } }) => {
          expect(article.comment_count).toBe(0);
        });
    });
    test("status: 404 - msg 'Article ID not found' for valid but non-existent article_id", () => {
      return request(app)
        .get("/api/articles/999999")
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Article ID not found");
        });
    });
    test("status: 400 - msg 'Invalid article ID' for invalid article_id", () => {
      return request(app)
        .get("/api/articles/invalid_id")
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Invalid article ID");
        });
    });
  });
  describe("PATCH", () => {
    test("status: 200 - increments votes for specified article in database by positive integer passed in request body", () => {
      return request(app)
        .patch("/api/articles/1")
        .send({ inc_votes: 10 })
        .expect(200)
        .then(() => {
          return request(app).get("/api/articles/1").expect(200);
        })
        .then(({ body: { article } }) => {
          expect(article.votes).toBe(110);
        });
    });
    test("status: 200 - decrements votes for specified article in database by negative integer passed in request body", () => {
      return request(app)
        .patch("/api/articles/1")
        .send({ inc_votes: -10 })
        .expect(200)
        .then(() => {
          return request(app).get("/api/articles/1").expect(200);
        })
        .then(({ body: { article } }) => {
          expect(article.votes).toBe(90);
        });
    });
    test("status: 200 - responds with a single object showing the updated article", () => {
      const article1Updated = {
        article_id: 1,
        title: "Living in the shadow of a great man",
        topic: "mitch",
        author: "butter_bridge",
        body: "I find this existence challenging",
        created_at: expect.any(String),
        votes: 200,
      };
      return request(app)
        .patch("/api/articles/1")
        .send({ inc_votes: 100 })
        .expect(200)
        .then(({ body: { article } }) => {
          expect(article).toEqual(article1Updated);
        });
    });
    test("status: 200 - additional data in request body is ignored", () => {
      const article1Updated = {
        article_id: 1,
        title: "Living in the shadow of a great man",
        topic: "mitch",
        author: "butter_bridge",
        body: "I find this existence challenging",
        created_at: expect.any(String),
        votes: 200,
      };
      return request(app)
        .patch("/api/articles/1")
        .send({
          inc_votes: 100,
          superfluousData: "Test data",
          article_id: "superfluous data",
        })
        .expect(200)
        .then(({ body: { article } }) => {
          expect(article).toEqual(article1Updated);
        });
    });
    test("status: 400 - msg 'Missing inc_votes data in request body' for request without inc_votes key in body", () => {
      return request(app)
        .patch("/api/articles/1")
        .send({})
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Missing inc_votes data in request body");
        });
    });
    test("status: 400 - msg 'Invalid inc_votes data in request body' for request with invalid inc_votes data type", () => {
      return request(app)
        .patch("/api/articles/1")
        .send({ inc_votes: "invalid data" })
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Invalid inc_votes data in request body");
        });
    });
    test("status: 404 - msg 'Article ID not found' for valid but non-existent article_id", () => {
      return request(app)
        .patch("/api/articles/999999")
        .send({ inc_votes: 10 })
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Article ID not found");
        });
    });
    test("status: 400 - msg 'Invalid article ID' for invalid article_id", () => {
      return request(app)
        .patch("/api/articles/invalid_id")
        .send({ inc_votes: 10 })
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Invalid article ID");
        });
    });
  });
});

describe("/api/articles", () => {
  describe("GET", () => {
    test("status: 200 - responds with an array of article objects", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(Array.isArray(articles)).toBe(true);
          expect(articles).toHaveLength(12);
        });
    });
    test("status: 200 - article objects in response have these properties: author, title, article_id, topic, created_at, votes", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then(({ body: { articles } }) => {
          articles.forEach((article) => {
            expect(article).toEqual(
              expect.objectContaining({
                author: expect.any(String),
                title: expect.any(String),
                article_id: expect.any(Number),
                topic: expect.any(String),
                created_at: expect.any(String),
                votes: expect.any(Number),
              })
            );
          });
        });
    });
    test("status: 200 - article objects in response have comment_count property equal to the number of comments associated with that article_id", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then(({ body: { articles } }) => {
          articles.forEach((article) => {
            expect(article).toEqual(
              expect.objectContaining({
                comment_count: expect.any(Number),
              })
            );
            if (article.article_id === 1) {
              expect(article.comment_count).toBe(11);
            }
            if (article.article_id === 2) {
              expect(article.comment_count).toBe(0);
            }
          });
        });
    });
    test("status: 200 - article objects in response do not have a body property (this exists in the articles table in the database)", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then(({ body: { articles } }) => {
          articles.forEach((article) => {
            expect(article).not.toHaveProperty("body");
          });
        });
    });
    test("status: 200 - article objects in response are sorted by created_at date in descending order by default", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles).toBeSortedBy("created_at", { descending: true });
        });
    });
    test("status: 200 - article objects in response are sorted by column specified in optional sort_by query - default order desc", () => {
      //valid sort_by options: author, title, article_id, topic, created_at, votes
      return request(app)
        .get("/api/articles?sort_by=author")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles).toBeSortedBy("author", { descending: true });
          return request(app).get("/api/articles?sort_by=title").expect(200);
        })
        .then(({ body: { articles } }) => {
          expect(articles).toBeSortedBy("title", { descending: true });
          return request(app)
            .get("/api/articles?sort_by=article_id")
            .expect(200);
        })
        .then(({ body: { articles } }) => {
          expect(articles).toBeSortedBy("article_id", { descending: true });
          return request(app).get("/api/articles?sort_by=topic").expect(200);
        })
        .then(({ body: { articles } }) => {
          expect(articles).toBeSortedBy("topic", { descending: true });
          return request(app)
            .get("/api/articles?sort_by=created_at")
            .expect(200);
        })
        .then(({ body: { articles } }) => {
          expect(articles).toBeSortedBy("created_at", { descending: true });
          return request(app).get("/api/articles?sort_by=votes").expect(200);
        })
        .then(({ body: { articles } }) => {
          expect(articles).toBeSortedBy("votes", { descending: true });
        });
    });
    test("status: 400 - msg 'Invalid sort_by query' for invalid sort_by column in query", () => {
      return request(app)
        .get("/api/articles?sort_by=invalid-sort-query")
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Invalid sort_by query");
        });
    });
    test("status: 200 - article objects in response are sorted in order specified by optional order query", () => {
      //valid order options: asc, desc
      return request(app)
        .get("/api/articles?order=asc")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles).toBeSortedBy("created_at", { ascending: true });
        });
    });
    test("status: 400 - msg 'Invalid order query' for invalid order in query", () => {
      return request(app)
        .get("/api/articles?order=invalid-order_query")
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Invalid order query");
        });
    });
    test("status: 200 - article objects in response are filtered by topic specified in optional topic query", () => {
      return request(app)
        .get("/api/articles?topic=cats")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles).toHaveLength(1);
        });
    });
    test("status: 200 - responds with empty articles array for a valid topic query with zero associated articles", () => {
      return request(app)
        .get("/api/articles?topic=paper")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles).toHaveLength(0);
        });
    });
    test("status: 404 - msg 'Topic not found' for topic query that does not exist in database", () => {
      return request(app)
        .get("/api/articles?topic=non-existent-topic")
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Topic not found");
        });
    });
    test("status: 200 - response is correct for multiple valid queries at once", () => {
      return request(app)
        .get("/api/articles?sort_by=title&order=asc&topic=mitch")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles).toHaveLength(11);
          expect(articles).toBeSortedBy("title", { ascending: true });
        });
    });
  });
  describe("POST", () => {
    test("status: 200 - adds article passed in request body to database", () => {
      const reqBody = {
        author: "butter_bridge",
        title: "test title",
        body: "test body",
        topic: "paper",
      };
      const articleInDb = {
        article_id: 13,
        votes: 0,
        created_at: expect.any(String),
        comment_count: 0,
        author: "butter_bridge",
        title: "test title",
        body: "test body",
        topic: "paper",
      };

      return request(app)
        .post("/api/articles")
        .send(reqBody)
        .expect(200)
        .then(() => {
          return request(app).get("/api/articles/13").expect(200);
        })
        .then(({ body: { article } }) => {
          expect(article).toEqual(articleInDb);
        });
    });
    test("status: 200 - responds with a single object showing the posted article", () => {
      const reqBody = {
        author: "butter_bridge",
        title: "test title",
        body: "test body",
        topic: "paper",
      };
      const newArticle = {
        article_id: 13,
        votes: 0,
        created_at: expect.any(String),
        comment_count: 0,
        author: "butter_bridge",
        title: "test title",
        body: "test body",
        topic: "paper",
      };

      return request(app)
        .post("/api/articles")
        .send(reqBody)
        .expect(200)
        .then(({ body: { article } }) => {
          expect(article).toEqual(newArticle);
        });
    });
    test("status: 200 - superfluous data in request body is ignored", () => {
      const reqBody = {
        author: "butter_bridge",
        title: "test title",
        body: "test body",
        topic: "paper",
        comment_count: "superfluous data",
        votes: "superfluous data",
      };
      const newArticle = {
        article_id: 13,
        votes: 0,
        created_at: expect.any(String),
        comment_count: 0,
        author: "butter_bridge",
        title: "test title",
        body: "test body",
        topic: "paper",
      };

      return request(app)
        .post("/api/articles")
        .send(reqBody)
        .expect(200)
        .then(({ body: { article } }) => {
          expect(article).toEqual(newArticle);
        });
    });
    test("status: 400 - msg 'Missing data in request body' for request without author/title/body/topic keys in body", () => {
      return request(app)
        .post("/api/articles")
        .send({})
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Missing data in request body");
        });
    });
    test("status: 404 - msg 'Username not found' for request with author not in database", () => {
      const reqBody = {
        author: "non-existent user",
        title: "test title",
        body: "test body",
        topic: "paper",
      };

      return request(app)
        .post("/api/articles")
        .send(reqBody)
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Username not found");
        });
    });
    test("status: 404 - msg 'Topic not found' for request with topic not in database", () => {
      const reqBody = {
        author: "butter-bridge",
        title: "test title",
        body: "test body",
        topic: "non-existent topic",
      };

      return request(app)
        .post("/api/articles")
        .send(reqBody)
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Topic not found");
        });
    });
  });
  describe("DELETE", () => {
    test("status: 204 - specified article is deleted from database", () => {
      return request(app)
        .delete("/api/articles/1")
        .expect(204)
        .then(() => {
          return request(app).get("/api/articles/1").expect(404);
        })
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Article ID not found");
        });
    });
    test("status: 204 - response body is empty", () => {
      return request(app)
        .delete("/api/articles/1")
        .expect(204)
        .then(({ body }) => {
          expect(body).toEqual({});
        });
    });
    test("status 404 - msg 'Article ID not found' for valid but non-existent article ID", () => {
      return request(app)
        .delete("/api/articles/9999")
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Article ID not found");
        });
    });
    test("status 400 - msg 'Invalid article ID' for invalid article ID", () => {
      return request(app)
        .delete("/api/articles/invalid-article-id")
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Invalid article ID");
        });
    });
  });
});

describe("/api/users", () => {
  describe("GET", () => {
    test("status: 200 - responds with an array of user objects", () => {
      return request(app)
        .get("/api/users")
        .expect(200)
        .then(({ body: { users } }) => {
          expect(Array.isArray(users)).toBe(true);
          expect(users).toHaveLength(4);
        });
    });
    test("status: 200 - user objects in response have 'username' property with string value", () => {
      return request(app)
        .get("/api/users")
        .expect(200)
        .then(({ body: { users } }) => {
          users.forEach((user) => {
            expect(user).toEqual(
              expect.objectContaining({
                username: expect.any(String),
              })
            );
          });
        });
    });
    test("status: 200 - user objects in response do not contain any other properties from the users table in the database", () => {
      return request(app)
        .get("/api/users")
        .expect(200)
        .then(({ body: { users } }) => {
          users.forEach((user) => {
            expect(user).not.toHaveProperty("name");
            expect(user).not.toHaveProperty("avatar_url");
          });
        });
    });
  });
});

describe("/api/users/:username", () => {
  describe("GET", () => {
    test("status: 200 - responds with a single user object with matching username", () => {
      return request(app)
        .get("/api/users/butter_bridge")
        .expect(200)
        .then(({ body: { user } }) => {
          expect(typeof user).toBe("object");
          expect(user.username).toBe("butter_bridge");
        });
    });
    test("status:200 - user object in response has these properties: username, avatar_url, name", () => {
      const userData = {
        username: "butter_bridge",
        name: "jonny",
        avatar_url:
          "https://www.healthytherapies.com/wp-content/uploads/2016/06/Lime3.jpg",
      };
      return request(app)
        .get("/api/users/butter_bridge")
        .expect(200)
        .then(({ body: { user } }) => {
          expect(user).toEqual(userData);
        });
    });
    test("status: 404 - msg 'User not found' for valid but non-existent username", () => {
      return request(app)
        .get("/api/users/non-existent-username")
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("User not found");
        });
    });
  });
});

describe("/api/articles/:article_id/comments", () => {
  describe("GET", () => {
    test("status: 200 - responds with an array of comment objects for the specified article_id", () => {
      return request(app)
        .get("/api/articles/1/comments")
        .expect(200)
        .then(({ body: { comments } }) => {
          expect(Array.isArray(comments)).toBe(true);
          expect(comments).toHaveLength(11);
        });
    });
    test("status: 200 - comment objects in response have these properties: comment_id, votes, created_at, author, body", () => {
      return request(app)
        .get("/api/articles/1/comments")
        .expect(200)
        .then(({ body: { comments } }) => {
          comments.forEach((comment) => {
            expect(comment).toEqual(
              expect.objectContaining({
                article_id: expect.any(Number),
                comment_id: expect.any(Number),
                votes: expect.any(Number),
                created_at: expect.any(String),
                author: expect.any(String),
                body: expect.any(String),
              })
            );
          });
        });
    });
    test("status: 200 - responds with empty array for article with no comments", () => {
      return request(app)
        .get("/api/articles/2/comments")
        .expect(200)
        .then(({ body: { comments } }) => {
          expect(comments).toEqual([]);
        });
    });
    test("status: 404 - msg 'Article ID not found' for valid but non-existent article_id", () => {
      return request(app)
        .get("/api/articles/9999/comments")
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Article ID not found");
        });
    });
    test("status: 400 - msg 'Invalid article ID' for invalid article_id", () => {
      return request(app)
        .get("/api/articles/invalid_id/comments")
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Invalid article ID");
        });
    });
  });
  describe("POST", () => {
    test("status: 200 - adds comment passed in request body to database for specified article_id", () => {
      const reqBody = { username: "butter_bridge", body: "test body" };
      const commentInDb = {
        article_id: 2,
        comment_id: 19,
        votes: 0,
        created_at: expect.any(String),
        author: "butter_bridge",
        body: "test body",
      };

      return request(app)
        .post("/api/articles/2/comments")
        .send(reqBody)
        .expect(200)
        .then(() => {
          return request(app).get("/api/articles/2/comments").expect(200);
        })
        .then(
          ({
            body: {
              comments: [comment],
            },
          }) => {
            expect(comment).toEqual(commentInDb);
          }
        );
    });
    test("status: 200 - responds with a single object showing the posted comment", () => {
      const reqBody = { username: "butter_bridge", body: "test body" };
      const newComment = {
        article_id: 2,
        comment_id: 19,
        votes: 0,
        created_at: expect.any(String),
        author: "butter_bridge",
        body: "test body",
      };

      return request(app)
        .post("/api/articles/2/comments")
        .send(reqBody)
        .expect(200)
        .then(({ body: { comment } }) => {
          expect(comment).toEqual(newComment);
        });
    });
    test("status: 200 - additional data in request body is ignored", () => {
      const reqBody = {
        username: "butter_bridge",
        body: "test body",
        article_id: "superfluous data",
        created_at: "superfluous data",
        votes: 1000000,
      };
      const newComment = {
        article_id: 2,
        comment_id: 19,
        votes: 0,
        created_at: expect.any(String),
        author: "butter_bridge",
        body: "test body",
      };

      return request(app)
        .post("/api/articles/2/comments")
        .send(reqBody)
        .expect(200)
        .then(({ body: { comment } }) => {
          expect(comment).toEqual(newComment);
        });
    });
    test("status: 400 - msg 'Missing data in request body' for request without 'body' and/or 'username' keys in body", () => {
      return request(app)
        .post("/api/articles/2/comments")
        .send({})
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Missing data in request body");
        });
    });
    test("status: 404 - msg 'Username not found' for request with username not in database", () => {
      const reqBody = { username: "non-existent user", body: "test body" };

      return request(app)
        .post("/api/articles/2/comments")
        .send(reqBody)
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Username not found");
        });
    });
    test("status: 404 - msg 'Article ID not found' for valid but non-existent article_id", () => {
      const reqBody = { username: "butter_bridge", body: "test body" };

      return request(app)
        .post("/api/articles/9999/comments")
        .send(reqBody)
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toEqual("Article ID not found");
        });
    });
    test("status: 400 - msg 'Invalid article ID' for invalid article_id", () => {
      const reqBody = { username: "butter_bridge", body: "test body" };

      return request(app)
        .post("/api/articles/invalid_id/comments")
        .send(reqBody)
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Invalid article ID");
        });
    });
  });
});

describe("/api/comments/:comment_id", () => {
  describe("DELETE", () => {
    test("status: 204 - specified comment is deleted from database", () => {
      return request(app)
        .delete("/api/comments/1")
        .expect(204)
        .then(() => {
          //test article that comment 1 belongs to has one fewer comment:
          return request(app).get("/api/articles/9").expect(200);
        })
        .then(({ body: { article } }) => {
          expect(article.comment_count).toBe(1);
        });
    });
    test("status: 204 - response body is empty", () => {
      return request(app)
        .delete("/api/comments/1")
        .expect(204)
        .then(({ body }) => {
          expect(body).toEqual({});
        });
    });
    test("status 404 - msg 'Comment ID not found' for valid but non-existent comment ID", () => {
      return request(app)
        .delete("/api/comments/9999")
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Comment ID not found");
        });
    });
    test("status 400 - msg 'Invalid comment ID' for invalid comment ID", () => {
      return request(app)
        .delete("/api/comments/invalid-comment-id")
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Invalid comment ID");
        });
    });
  });
  describe("PATCH", () => {
    test("status: 200 - increments votes for specified comment in database by positive integer passed in request body", () => {
      return request(app)
        .patch("/api/comments/1")
        .send({ inc_votes: 10 })
        .expect(200)
        .then(({ body: { comment } }) => {
          expect(comment.votes).toBe(26);
        });
    });
    test("status: 200 - decrements votes for specified comment in database by negative integer passed in request body", () => {
      return request(app)
        .patch("/api/comments/1")
        .send({ inc_votes: -10 })
        .expect(200)
        .then(({ body: { comment } }) => {
          expect(comment.votes).toBe(6);
        });
    });
    test("status: 200 - responds with a single object showing the updated comment", () => {
      const comment1Updated = {
        comment_id: 1,
        body: "Oh, I've got compassion running out of my nose, pal! I'm the Sultan of Sentiment!",
        votes: 26,
        author: "butter_bridge",
        article_id: 9,
        created_at: expect.any(String),
      };
      return request(app)
        .patch("/api/comments/1")
        .send({ inc_votes: 10 })
        .expect(200)
        .then(({ body: { comment } }) => {
          expect(comment).toEqual(comment1Updated);
        });
    });
    test("status: 200 - additional data in request body is ignored", () => {
      const comment1Updated = {
        comment_id: 1,
        body: "Oh, I've got compassion running out of my nose, pal! I'm the Sultan of Sentiment!",
        votes: 26,
        author: "butter_bridge",
        article_id: 9,
        created_at: expect.any(String),
      };
      return request(app)
        .patch("/api/comments/1")
        .send({
          inc_votes: 10,
          superfluousData: "Test data",
          comment_id: "superfluous data",
        })
        .expect(200)
        .then(({ body: { comment } }) => {
          expect(comment).toEqual(comment1Updated);
        });
    });
    test("status: 400 - msg 'Missing inc_votes data in request body' for request without inc_votes key in body", () => {
      return request(app)
        .patch("/api/comments/1")
        .send({})
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Missing inc_votes data in request body");
        });
    });
    test("status: 400 - msg 'Invalid inc_votes data in request body' for request with invalid inc_votes data type", () => {
      return request(app)
        .patch("/api/comments/1")
        .send({ inc_votes: "invalid data" })
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Invalid inc_votes data in request body");
        });
    });
    test("status: 404 - msg 'Comment ID not found' for valid but non-existent comment_id", () => {
      return request(app)
        .patch("/api/comments/999999")
        .send({ inc_votes: 10 })
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Comment ID not found");
        });
    });
    test("status: 400 - msg 'Invalid comment ID' for invalid comment_id", () => {
      return request(app)
        .patch("/api/comments/invalid_id")
        .send({ inc_votes: 10 })
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Invalid comment ID");
        });
    });
  });
});

describe("/api", () => {
  describe("GET", () => {
    test("status: 200 - responds with JSON representation of all available endpoints on api", () => {
      return request(app)
        .get("/api")
        .expect(200)
        .then(({ body: { endpoints } }) => {
          expect(endpoints).toEqual(
            expect.objectContaining({
              "GET /api": expect.any(Object),
              "GET /api/topics": expect.any(Object),
              "GET /api/articles": expect.any(Object),
              "GET /api/articles/:article_id": expect.any(Object),
              "PATCH /api/articles/:article_id": expect.any(Object),
              "GET /api/users": expect.any(Object),
              "GET /api/articles/:article_id/comments": expect.any(Object),
              "POST /api/articles/:article_id/comments": expect.any(Object),
              "DELETE /api/comments/:comment_id": expect.any(Object),
            })
          );
        });
    });
  });
});
