import React from 'react'
import { Route } from 'react-router-dom'
import Login from '../pages/Login'
import Home from '../pages/Home'

const routes = [
  { path: "/login", element: <Login />,},
  { path: "/home", element: <Home />,},

]

const Routes = (
  <>
    {routes.map(({ path, element}, index) => (
      <Route
        key={index}
        path={path}
        element={element}
      />
    ))}
  </>
) 

export default Routes
