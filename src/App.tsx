import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Gallery from './screens/Gallery';
import Editor from './screens/Editor';
import './style.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <NavBar />
        
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/editor/:id" element={<Editor />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;