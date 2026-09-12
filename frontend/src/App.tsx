import Main from "./components/main-layout/MainLayout";
import NavBar from "./components/navbar/NavBar";
import home from "./assets/img/home.jpg";

function App() {
  return (
    <div
      className="h-screen bg-cover bg-no-repeat"
      style={{ backgroundImage: `url(${home})` }}
    >
      <NavBar />
      <Main />
    </div>
  );
}

export default App;
