export default function TestApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>AdaptaLyfe Test</h1>
      <p>React is working properly!</p>
      <button onClick={() => alert('JavaScript is working!')}>
        Click me to test JS
      </button>
    </div>
  );
}