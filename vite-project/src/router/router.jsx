import React from 'react'
import { Route } from 'react-router-dom'
import Login from '../pages/Login'
const routes = [
  { path: "/login", element: <SearchRoomPage />,},
]

const Routes = (
  <>
    {routes.map(({ path, element}, index) => (
      <Route
        key={index}
        path={path}
      />
    ))}
  </>
) 

export default Routes
