import { useState } from 'react';
import './App.css';
import { jokes } from './data/jokes';
import Button from './components/Button/Button';
import Card from './components/Card/Card';

function App() {
  const [joke, setJoke] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [usedIndices, setUsedIndices] = useState([]);

  const getNextJoke = () => {
    setAnimating(true);
    setTimeout(() => {
      let available = jokes.map((_, i) => i).filter(i => !usedIndices.includes(i));
      if (available.length === 0) {
        setUsedIndices([]);
        available = jokes.map((_, i) => i);
      }
      const pick = available[Math.floor(Math.random() * available.length)];
      setUsedIndices(prev => [...prev, pick]);
      setJoke(jokes[pick]);
      setAnimating(false);
    }, 180);
  };

  return (
    <div className="app">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="container">
        <header className="header">
          <h1 className="title">dev<span>jokes</span></h1>
          <p className="subtitle">99 handpicked programming jokes</p>
        </header>

        <main className="main">
          <Card className={`joke-card ${animating ? 'fade-out' : 'fade-in'}`}>
            {joke ? (
              <>
                <p className="joke-setup">{joke.setup}</p>
                <div className="divider" />
                <p className="joke-punchline">{joke.punchline}</p>
              </>
            ) : (
              <p className="joke-placeholder">Hit the button below for a laugh</p>
            )}
          </Card>

          <Button onClick={getNextJoke}>
            {joke ? 'Next Joke' : 'Tell Me a Joke'}
          </Button>

          {usedIndices.length > 0 && (
            <p className="counter">{usedIndices.length} of {jokes.length} jokes told</p>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
