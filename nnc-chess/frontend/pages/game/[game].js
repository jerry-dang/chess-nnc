import VideoConnection from './VideoConnection';
import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import './[game].css';

const Chessboard = dynamic(() => import('chessboardjsx'), {
  ssr: false, // prevents server-side rendering.
});

const Game = () => {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [pgnHistory, setPgnHistory] = useState('');
  const [playerRole, setPlayerRole] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const router = useRouter();
  const { game: gameId } = router.query;

  let ws = useRef(null);

  useEffect(() => {
    if (!gameId) return; // Do not proceed if gameId is not set
    // Initialize the WebSocket connection
    ws.current = new WebSocket('ws://34.130.219.58:8080');
  
    if (ws.current) {
      ws.onopen = () => {
        console.log('Connected to WebSocket for game:', gameId);
      };

      ws.current.onmessage = (event) => {
        if (event.data instanceof Blob) {
          // If the data is a Blob, read it as text
          const reader = new FileReader();
          reader.onload = () => {
            console.log("Blob data received:", reader.result);
            const message = JSON.parse(reader.result);
            // Rest of your code...
            if (message.type === 'roleAssignment') {
              setPlayerRole(message.role);
              console.log(`Assigned role: ${message.role}`);
            } else if (message.gameId === gameId) {
              setFen(message.fen);
              console.log("Updated game state. Current turn:", game.turn());
              setPgnHistory(message.pgnHistory);
            }
          };
          reader.readAsText(event.data);
        } else {
          console.log("Message received:", event.data);
          // If the data is not a Blob, parse it directly
          const message = JSON.parse(event.data);
          // Rest of your code...
          if (message.type === 'roleAssignment') {
            setPlayerRole(message.role);
            console.log(`Assigned role: ${message.role}`);
            console.log("Game ID check:", message.gameId, gameId);
          } else if (message.gameId === gameId) {
            setFen(message.fen);
            console.log("Updated game state. Current turn:", game.turn());
            setPgnHistory(message.pgnHistory);
          }
        }
      };
    }
  
    return () => {
      if (ws.current) {
        console.log('Closing WebSocket for game:', gameId);
        ws.current.close();
      }
    };
  }, [gameId]);  

  useEffect(() => {
    setGame(new Chess());
  }, [gameId]);  

  const handleMove = ({sourceSquare, targetSquare}) => {
    // Check if it's the player's turn for subsequent moves
    console.log("Fen string:", game.fen())
    console.log("Player role:", playerRole);
    console.log("Game turn:", game.turn());
    if ((game.turn() === 'w' && playerRole !== 'white') || (game.turn() === 'b' && playerRole !== 'black')) {
      console.log("Not your turn");
      return false;
    }
    try {
      // Attempt to make a move
      let move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to a queen for simplicity
      });
  
      // If the move is illegal, return false
      if (move === null) {
        throw new Error('Illegal move');
      }
  
      // If the move is legal, update the game state
      setFen(game.fen());
      setMoveHistory(prevHistory => [...prevHistory, fen]);
      setPgnHistory(game.pgn());
      setCurrentMoveIndex(moveHistory.length-1);

      // Define the message variable with the game state
      const message = JSON.stringify({
        gameId,
        fen: game.fen(),
        pgnHistory: game.pgn()
      });

      console.log('Sending message', message);

      // Check if WebSocket is connected before sending
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(message);
      }

      return true;
    } catch (error) {
      console.error(error);
      // Handle the error (e.g., show an error message to the user)
      return false;
    }
  };

  const goToPreviousMove = () => {
    setCurrentMoveIndex(prevIndex => Math.max(prevIndex - 1, 0));
    setFen(moveHistory[currentMoveIndex]);
  };

  const goToNextMove = () => {
    setCurrentMoveIndex(prevIndex => Math.min(prevIndex + 1, moveHistory.length - 1));
    setFen(moveHistory[currentMoveIndex]);
  }; 

  useEffect(() => {
    game.loadPgn(pgnHistory); // Update the game object with the latest FEN
  }, [pgnHistory]); // Re-run this effect whenever 'fen' changes

  const formatPgnHistory = (pgn) => {
    // Split the PGN string into individual moves, including move numbers
    const regex = /(\d+\.\s?\S+(?:\s+\S+)?)/g;
    return pgn.match(regex) || [];
  };

  useEffect(() => {
    // Check for game over after every move
    if (game.isGameOver()) {
      let message;
      if (game.isCheckmate()) {
        const winner = game.turn() === 'w' ? 'Black' : 'White';
        message = `${winner} wins by checkmate`;
      } else if (game.isDraw()) {
        message = 'Game is a draw';
      } else if (game.isStalemate()) {
        message = 'Game is a stalemate';
      } else if (game.isThreefoldRepetition()) {
        message = 'Game is a draw due to threefold repetition';
      } else if (game.isInsufficientMaterial()) {
        message = 'Game is a draw due to insufficient material';
      }
      setGameOverMessage(message);
    }
  }, [fen, game]);

  const copyPgnToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pgnHistory);
      alert("PGN copied to clipboard!"); // Optional: Notify the user
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };  

  const resetBoard = () => {
    game.reset();
    setFen(game.fen());
  }

  return (
    <div className='game-page'>
      <VideoConnection/>
      <div className='chess-game'>
        <div className='board'>
          <Chessboard position={fen} width={700}
            onDrop={(move) => handleMove(move)}/>
        </div>
        <div className='pgn-history'>
          <pre>{formatPgnHistory(pgnHistory).map((move, index) => (
            <div key={index}>{move}</div>
          ))}</pre>
        </div>
      </div>
      <div className='game-over-message'>
        <pre>{gameOverMessage}</pre>
      </div>
      <div className='button-container'>
        <button onClick={goToPreviousMove} disabled={currentMoveIndex === 0}>
          ← Previous Move
        </button>
        <button onClick={goToNextMove} disabled={currentMoveIndex === moveHistory.length - 1}>
          Next Move →
        </button>
        <button onClick={resetBoard}>Reset Board</button>
        <button onClick={copyPgnToClipboard}>Export PGN</button>
      </div>
    </div>
  );
};

export default Game;
