import { useState } from 'react';
import './App.css';

const jokes = [
  { setup: "Why do programmers prefer dark mode?", punchline: "Because light attracts bugs!" },
  { setup: "Why did the developer go broke?", punchline: "Because he used up all his cache." },
  { setup: "How many programmers does it take to change a light bulb?", punchline: "None. That's a hardware problem." },
  { setup: "Why do Java developers wear glasses?", punchline: "Because they don't C#." },
  { setup: "A SQL query walks into a bar, walks up to two tables and asks...", punchline: "\"Can I join you?\"" },
  { setup: "Why was the JavaScript developer sad?", punchline: "Because he didn't know how to 'null' his feelings." },
  { setup: "What's a programmer's favorite hangout place?", punchline: "Foo Bar." },
  { setup: "How do you comfort a JavaScript bug?", punchline: "You console it." },
  { setup: "What's the object-oriented way to become wealthy?", punchline: "Inheritance." },
  { setup: "Why did the programmer quit his job?", punchline: "Because he didn't get arrays." },
  { setup: "Why did the developer go to therapy?", punchline: "Too many unresolved issues." },
  { setup: "What is a computer's favorite snack?", punchline: "Microchips." },
  { setup: "Why did the Python programmer get glasses?", punchline: "Because she couldn't C." },
  { setup: "Why are Assembly programmers always on time?", punchline: "They work at a lower level." },
  { setup: "What do you call a programmer who doesn't comment their code?", punchline: "A job security expert." },
  { setup: "Why did the database admin leave his wife?", punchline: "She had one too many foreign keys." },
  { setup: "Why do backend devs make great partners?", punchline: "They handle all your requests." },
  { setup: "What's a developer's favorite tea?", punchline: "URL Grey." },
  { setup: "Why was the computer cold?", punchline: "It left its Windows open." },
  { setup: "What did the router say to the doctor?", punchline: "It hurts when IP." },
  { setup: "Why do programmers hate nature?", punchline: "It has too many bugs." },
  { setup: "Why did the coder get fired from NASA?", punchline: "He kept crashing the server." },
  { setup: "Why did the developer get kicked out of the restaurant?", punchline: "He kept trying to fork the bill." },
  { setup: "How do you know a programmer is extroverted?", punchline: "They look at your shoes instead of their own." },
  { setup: "Why did the React developer break up with Redux?", punchline: "Too much state management." },
  { setup: "What's a programmer's least favorite food?", punchline: "Spaghetti — unless it's in the codebase." },
  { setup: "Why did the Git commit panic?", punchline: "It was pushed to the wrong branch." },
  { setup: "Why do programmers always mix up their children's names?", punchline: "Off-by-one errors." },
  { setup: "What did the programmer say when he ran out of shampoo?", punchline: "I'll have to use the else." },
  { setup: "Why don't programmers like to go outside?", punchline: "The sunlight causes too much glare on the screen." },
  { setup: "What's the difference between a developer and a pizza?", punchline: "A pizza can feed a family of four." },
  { setup: "What do you call a programmer who only works in the morning?", punchline: "An early bird.catch() handler." },
  { setup: "Why did the CSS developer get divorced?", punchline: "Too many conflicts — especially with the box model." },
  { setup: "What's a pirate's favorite programming language?", punchline: "R! But they really prefer the C." },
  { setup: "What is the biggest lie in computing?", punchline: "\"I'll document it later.\"" },
  { setup: "Why did the Boolean feel lonely?", punchline: "It was always either true or false — never in between." },
  { setup: "Why did the junior dev stare at the glass of juice?", punchline: "Because the box said 'concentrate'." },
  { setup: "What's the difference between a bug and a feature?", punchline: "The documentation." },
  { setup: "Why don't programmers like stairs?", punchline: "They prefer recursion." },
  { setup: "What do you call two database tables that went on a date?", punchline: "A join." },
  { setup: "Why did the developer get bad grades?", punchline: "Because he was always skipping classes." },
  { setup: "What did the senior developer say to the junior?", punchline: "\"It works on my machine.\"" },
  { setup: "Why was the null pointer so popular?", punchline: "Because it pointed to everything and nothing at once." },
  { setup: "What's the most terrifying thing a developer can read?", punchline: "\"TODO: fix this.\" — written by yourself, 3 years ago." },
  { setup: "Why are Linux users so happy?", punchline: "Because every problem can be solved with a terminal." },
  { setup: "Why did the frontend dev bring a ladder to work?", punchline: "To reach the higher CSS specificity." },
  { setup: "What's the scariest Git command?", punchline: "git reset --hard" },
  { setup: "Why do programmers hate the beach?", punchline: "Too many shells and no terminal." },
  { setup: "What do you call a function that does everything?", punchline: "A monolith. Also: technical debt." },
  { setup: "Why is Python so popular?", punchline: "It has great libraries — and it never bites... usually." },
  { setup: "What's an optimist programmer?", punchline: "Someone who thinks the code is half-working." },
  { setup: "What did the code reviewer say to the pull request?", punchline: "\"You need some changes before I can merge with you.\"" },
  { setup: "What happened when the programmer ran into an infinite loop?", punchline: "He's still in there." },
  { setup: "What do you call spaghetti code that works?", punchline: "Production." },
  { setup: "What do you call a developer who doesn't test?", punchline: "A daredevil." },
  { setup: "Why was the API so popular at parties?", punchline: "It always knew how to handle requests." },
  { setup: "Why did the JavaScript framework break up with the team?", punchline: "They couldn't keep up with its updates." },
  { setup: "Why did the developer fail the driving test?", punchline: "He kept trying to pass by reference." },
  { setup: "Why was the variable always confused?", punchline: "It never knew its type." },
  { setup: "What's the most important soft skill for a developer?", punchline: "The ability to Google professionally." },
  { setup: "What do you call a programmer's to-do list?", punchline: "A backlog of regrets." },
  { setup: "What's the difference between senior and junior developers?", punchline: "Seniors know which Stack Overflow answer to copy." },
  { setup: "Why did the REST API feel neglected?", punchline: "Because nobody ever sent it a POST request." },
  { setup: "What do you call a programmer with no bugs?", punchline: "A liar." },
  { setup: "Why do programmers confuse Halloween and Christmas?", punchline: "Because Oct 31 == Dec 25." },
  { setup: "Why don't computers go to church?", punchline: "They don't believe in cache." },
  { setup: "What did one CPU say to another during an argument?", punchline: "\"You're just not processing this correctly.\"" },
  { setup: "What do you call a programmer who writes on paper?", punchline: "An analog developer." },
  { setup: "Why can't a bicycle stand on its own?", punchline: "Because it's two-tired... like this codebase." },
  { setup: "What's the difference between a developer and a mathematician?", punchline: "A mathematician thinks 1000 is a big number." },
  { setup: "Why was the algorithm always anxious?", punchline: "Too many worst-case scenarios." },
  { setup: "What did the DevOps engineer say at the party?", punchline: "\"Sorry, I can't stay — I'm on-call.\"" },
  { setup: "Why do developers prefer dark chocolate?", punchline: "Less sugar, more bitterness — just like their standups." },
  { setup: "What's a hacker's favorite season?", punchline: "Phishing season." },
  { setup: "Why do programmers always carry a pencil?", punchline: "In case they need to draw() something." },
  { setup: "What did the compiler say to the developer?", punchline: "\"You have 99 problems and a syntax error is one.\"" },
  { setup: "Why did the programmer wear a suit?", punchline: "He was going to a formal parameter." },
  { setup: "What's a developer's favorite cheese?", punchline: "Gouda code." },
  { setup: "Why did the website go to the doctor?", punchline: "It had a 404 temperature." },
  { setup: "What do you call a group of programmers?", punchline: "An array." },
  { setup: "Why did the developer refuse to sort the array?", punchline: "He thought it was already good enough." },
  { setup: "What's the first thing a programmer does in the morning?", punchline: "npm install coffee." },
  { setup: "Why was the smartphone feeling philosophical?", punchline: "It kept asking: \"What is my purpose? To render ads?\"" },
  { setup: "What do you call a programmer who only uses spaces?", punchline: "Consistent." },
  { setup: "Why does the Agile team work so fast?", punchline: "Two-week sprints." },
  { setup: "What's a blockchain developer's favorite drink?", punchline: "Decentralized lemonade." },
  { setup: "Why did the programmer give up origami?", punchline: "Too many paper folds caused a stack overflow." },
  { setup: "What do you call a broken keyboard?", punchline: "Not your problem after git blame." },
  { setup: "Why was the microservice so lonely?", punchline: "It had no dependencies." },
  { setup: "What do you call a programmer's child?", punchline: "A little debugger." },
  { setup: "Why don't programmers like camping?", punchline: "Too many tents with no Wi-Fi." },
  { setup: "What's a developer's least favorite word?", punchline: "\"Urgent.\"" },
  { setup: "Why did the container ship look confused?", punchline: "It kept asking: \"Am I running Docker or am I Docker running?\"" },
  { setup: "What do junior developers dream of?", punchline: "Passing their first code review without 47 comments." },
  { setup: "Why was the linked list so dramatic?", punchline: "Every node pointed to something it couldn't let go of." },
  { setup: "What's the difference between a developer and a pizza delivery person?", punchline: "The pizza delivery person can always deliver on time." },
  { setup: "Why did the programmer delete their Twitter?", punchline: "The character limit was bad for their comment style." },
  { setup: "What do you call a commit message at 3am?", punchline: "\"fix stuff\" — and everyone knows it." },
];

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
          <div className={`joke-card ${joke ? 'has-joke' : ''} ${animating ? 'fade-out' : 'fade-in'}`}>
            {joke ? (
              <>
                <p className="joke-setup">{joke.setup}</p>
                <div className="divider" />
                <p className="joke-punchline">{joke.punchline}</p>
              </>
            ) : (
              <p className="joke-placeholder">Hit the button below for a laugh</p>
            )}
          </div>

          <button className="joke-btn" onClick={getNextJoke}>
            {joke ? 'Next Joke' : 'Tell Me a Joke'}
          </button>

          {usedIndices.length > 0 && (
            <p className="counter">{usedIndices.length} of 99 jokes told</p>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
