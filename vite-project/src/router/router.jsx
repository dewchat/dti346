import React from 'react'
import { Route } from 'react-router-dom'
import Login from '../pages/Login'
import Home from '../pages/Home'
import Menu from '../pages/Menu'
import Cart from '../pages/Cart'
import History from '../pages/History'
import Chat from '../pages/Chat'
import Profile from '../pages/Profile'
import CreateRestaurant from '../pages/CreateRestaurant'

const routes = [
  { path: "/", element: <Login />,},
  { path: "/home", element: <Home />,},
  { path: "/restaurant/:restaurantId", element: <Menu />,},
  { path: "/cart", element: <Cart />,},
  { path: "/history", element: <History />,},
  { path: "/chat/:orderId", element: <Chat />,},
  { path: "/order/:orderId", element: <Chat />,},
  { path: "/profile", element: <Profile />,},
  { path: "/create-restaurant", element: <CreateRestaurant />,},
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
