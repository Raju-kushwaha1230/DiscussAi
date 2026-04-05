import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home'
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Forgot from './pages/Auth/Forgot';
import Dashboard from './pages/Dashboard/Dashboard';
import RoomSetup from './pages/Room/RoomSetup';
import DiscussionRoom from './pages/Room/DiscussionRoom';
import { AuthProvider } from './context/AuthContext';
import PublicRoute from './Routes/PublicRoutes';
import PrivateRoute from './Routes/PrivateRoutes';

function App() {

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path='/' element={<Home />} />

          <Route  element={<PublicRoute />} >
            <Route path='/login' element={<Login />} />
            {/* <Route path="/login" element={<div>Login Page</div>} /> */}
            <Route path='/register' element={<Register />} />
            <Route path='/forget-password' element={<Forgot />} />
          </Route>

          
          <Route element={<PrivateRoute/>  } >
            <Route path='/dashboard' element={<Dashboard />} />
          <Route path='/room/setup' element={<RoomSetup />} />
          <Route path='/room/:roomId' element={<DiscussionRoom />} />
          </Route>
          
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
