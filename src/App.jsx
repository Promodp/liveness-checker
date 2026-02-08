import FaceLiveness from "./components/FaceLiveness";

export default function App() {
  return (
    <div style={{ padding: 40, transform: 'translate(50%, 0%)' }}>
      <h2>Face Liveness Check</h2>
      <p>Slowly turn your head left and right</p>
      <FaceLiveness />
    </div>
  );
}
