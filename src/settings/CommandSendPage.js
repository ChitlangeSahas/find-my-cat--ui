import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Container,
  Button,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from '../common/components/LocalizationProvider';
import BaseCommandView from './components/BaseCommandView';
import SelectField from '../common/components/SelectField';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import { useCatch } from '../reactHelper';

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(2),
  },
  buttons: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    display: 'flex',
    justifyContent: 'space-evenly',
    '& > *': {
      flexBasis: '33%',
    },
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    paddingBottom: theme.spacing(3),
  },
}));

const CommandSendPage = () => {
  const navigate = useNavigate();
  const classes = useStyles();
  const t = useTranslation();

  const { deviceId } = useParams();

  const [savedId, setSavedId] = useState(0);
  const [item, setItem] = useState({});

  const handleSend = useCatch(async () => {
    let command;
    if (savedId) {
      const response = await fetch(`/api/commands/${savedId}`);
      if (response.ok) {
        command = await response.json();
      } else {
        throw Error(await response.text());
      }
    } else {
      command = item;
    }

    command.deviceId = parseInt(deviceId, 10);

    const response = await fetch('/api/commands/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });

    if (response.ok) {
      navigate(-1);
    } else {
      throw Error(await response.text());
    }
  });

  const validate = () => savedId || (item && item.type);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'deviceCommand']}>
      <Container maxWidth="xs" className={classes.container}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">
              {t('sharedRequired')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.details}>
            <SelectField
              value={savedId}
              emptyTitle={t('sharedNew')}
              onChange={(e) => setSavedId(e.target.value)}
              endpoint={`/api/commands/send?deviceId=${deviceId}`}
              titleGetter={(it) => it.description}
              label={t('sharedSavedCommand')}
            />
            {!savedId && (
              <BaseCommandView item={item} setItem={setItem} />
            )}
          </AccordionDetails>
        </Accordion>
        <div className={classes.buttons}>
          <Button
            type="button"
            color="primary"
            variant="outlined"
            onClick={() => navigate(-1)}
          >
            {t('sharedCancel')}
          </Button>
          <Button
            type="button"
            color="primary"
            variant="contained"
            onClick={handleSend}
            disabled={!validate()}
          >
            {t('commandSend')}
          </Button>
        </div>
      </Container>
    </PageLayout>
  );
};

export default CommandSendPage;
