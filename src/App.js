import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LinearProgress } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import SocketController from './SocketController';
import CachingController from './CachingController';

const useStyles = makeStyles(() => ({
  page: {
    flexGrow: 1,
    overflow: 'auto',
  },
  menu: {
    zIndex: 1204,
  },
}));

const App = () => {
  const classes = useStyles();

  const initialized = useSelector((state) => !!state.session.user);

  return (
    <>
      <SocketController />
      <CachingController />
      {!initialized ? (<LinearProgress />) : (
        <div className={classes.page}>
          <Outlet />
        </div>
      )}
    </>
  );
};

export default App;
