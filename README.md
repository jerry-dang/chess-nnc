# NNC Chess

## Project Video URL 

https://www.youtube.com/watch?v=hI9_24moX0s

## Project Description

This web application consists of an online chess game where two players are able to connect to a single server and play against each other in real-time. The players should be able to create/access a link that connects them to the same game and be able to start by making the first move (as white) and have the other player play as the black pieces and finish the game abiding chess rules. As for an interesting part of this app, we would like to add a unique feature of invigilation in two different ways: where the two players will have to be on camera and where we will use an open-source API (Stockfish) for positional analysis. In addition, the application will have an authentication system where users will be able to sign up/login where they can see other users' profiles and add them as friends along with a notifications panel.

## Development

**Task:** Leaving deployment aside, explain how the app is built. Please describe the overall code design and be specific about the programming languages, framework, libraries and third-party api that you have used. 

Leaving deployment aside, the app is built with the frontend framework, Next.js (a React framework) combined with a Node.js and Express backend with MongoDB as the NoSQL cloud database. Similar to the ToDo React app, we did not use any of the backend features that Next.js had to offer and instead decided to stick with a separate frontend and backend component/folder for the file structure. The code design revolves around the frontend folder containing all the pages and components that interact with each other alongisde an api folder which defines all the api calls that the frontend will make to the backend depending on the user actions. The backend folder contains the main backend file which is app.mjs that is responsible for data handling, authentication, authorization, and web socket communication. We mainly used javascript (.js) for simplicity but also used (.jsx) which made the code more readable. Originally, we were going to use typescript but for the sake of time, decided to go with plain javascript.

Some notable libraries that we used that helped us in our developement were chess.js and chessboard.js, which were the two main modules that helped us implement the main feature of our application, which is to be able to create a chess game and play with another user in real-time. The two libraries mainly provided us with pre-defined chess logic so that we would not have to waste time on trivial issues such as piece movement, board definition, the appearnce of the pieces, and etc. and be able to focus more on the website itself. We also used socket.io for web socket connection in order to create a message channel that connects two players in order to see the moves in real-time.

A third-party api that we used is called Stockfish (also a library stockfish.js) is mainly used in the backend for positional analysis. This api can evaluate a chess position at any time - however, this feature was only implemented in the backend and can be called using the endpoint but is not currently implemented in the frontend. 

## Deployment

**Task:** Explain how you have deployed your application. 

We deployed our application similar to the ToDo React app in lab9 using GCP and docker. We figured the cors so that the frontend would interact seamlessly with the backend through port 3000 and 4000 similar to the lab9 configurations. All the steps from the lab9 updated instructions were followed since our code has similar structure with a frontend and a backend folder. Two containers were build from installing and updating docker on the VM instance from the compute engine. An extra step to add a tag with port 8080 in the VPC firewall settings allowed the IP connection from my local machine to the server and that was considered when building the backend folder as well. 

## Challenges

**Task:** What is the top 3 most challenging things that you have learned/developed for you app? Please restrict your answer to only three items. 

1. Migrating to MongoDB, we were used to working with NeDB and had to migrate to MongoDB partway after devloping most of the features, which resulted in a lot of bugs
2. Deloying the application itself took awhile to configure and manage a successful app deployment
3. Creating a web socket server to allow multiple players to join the game and be able to finish the game, video connection was implemented as well but sadly is not currently working production.

## Contributions

Jerry Dang: Mainly implemented the chess game logic, user interface, and user login and signup. Contributed to deployment and overall frontend code structure. Helped plan the application as well.

Tom Sadan: Mainly implemented the backend logic and code structure. Implemented WebRTC peer-to-peer connection for video feed, however it currently is not working on production. Implemented stockfish backend support as well but no frontend implementation. Also helped with user interface and overall appearance. Helped plan the application as well.

David Wu: Helped with adding/removing friends and notifications handling. He helped with the backend Api calls and helped design the frontend. David Wu has also helepd with the deployment and recording of the video, as well as the migration from NeDB to MongoDB. He also helped with the Project Survey and overall planning of the application.

