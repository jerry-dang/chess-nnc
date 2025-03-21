// Credit to https://www.stackfive.io/work/webrtc/peer-to-peer-video-call-with-next-js-socket-io-and-native-webrtc-apis

import Head from 'next/head'
import { useRouter } from 'next/navigation'
import './JoinGameModule.css';

export function JoinGameModule() {
  const router = useRouter();

  const joinRoom = () => {
    const gameId = Math.random().toString(36).slice(2);

    router.push(`/game/${gameId}`);
  }

  return (
    <div className="container">
      <main className="main">
       <button onClick={joinRoom} type="button" className='button'>Create game</button>
      </main>
    </div>
  )
}