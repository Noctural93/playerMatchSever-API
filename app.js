const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const pathDb = path.join(__dirname, "cricketMatchDetails.db");
app.use(express.json());
let db = null;

const initializeDbToServer = async () => {
  try {
    db = await open({
      filename: pathDb,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Db error ${error.message}`);
    process.exit(1);
  }
};

initializeDbToServer();

const convertPlayerObjToResponsiveObj = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchObjToResponsiveObj = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertPlayerMatchObjToResponsiveObj = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

// Get Method - all players

app.get("/players/", async (request, response) => {
  const reqQuery = `
    SELECT
        *
    FROM
        player_details;`;
  const dbResponse = await db.all(reqQuery);
  response.send(
    dbResponse.map((eachPlayer) => convertPlayerObjToResponsiveObj(eachPlayer))
  );
});

// Get Method - Particular Player
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const reqQuery = `
    SELECT 
        *
    FROM 
        player_details
    WHERE
        player_id = ${playerId};`;
  const dbResponse = await db.get(reqQuery);
  response.send(convertPlayerObjToResponsiveObj(dbResponse));
});
// Put Method - update players details
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const reqQuery = `
    UPDATE
        player_details
    SET 
        player_name= '${playerName}'
    WHERE
        player_id = ${playerId};`;
  await db.run(reqQuery);
  response.send("Player Details Updated");
});
// Get Method - matches api
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const reqQuery = `
    SELECT
        *
    FROM
        match_details
    WHERE
        match_id = ${matchId};`;
  const dbResponse = await db.get(reqQuery);
  response.send(convertMatchObjToResponsiveObj(dbResponse));
});
// Get Method - player matches
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const reqMatchesQuery = `
    SELECT
        *
    FROM
        player_match_score NATURAL JOIN match_details
    WHERE
        player_id = ${playerId};`;
  const dbResponse = await db.all(reqMatchesQuery);
  response.send(
    dbResponse.map((eachMatch) => convertMatchObjToResponsiveObj(eachMatch))
  );
});
// Get Method - matches played by players
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const reqQuery = `
    SELECT
        *
    FROM
        player_match_score NATURAL JOIN player_details
    WHERE
        match_id = ${matchId};`;
  const dbResponse = await db.all(reqQuery);
  response.send(
    dbResponse.map((eachPlayer) => convertPlayerObjToResponsiveObj(eachPlayer))
  );
});

// Get Method - stats of a players
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const reqQuery = `
    SELECT
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(player_match_score.fours) AS totalFours,
        SUM(player_match_score.sixes) AS totalSixes
    FROM
        player_match_score INNER JOIN player_details
        ON player_details.player_id = player_match_score.player_id
    WHERE
        player_details.player_id = ${playerId};`;
  const dbResponse = await db.get(reqQuery);
  response.send(dbResponse);
});
module.exports = app;
