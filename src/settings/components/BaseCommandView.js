import React, { useEffect, useState } from 'react';
import {
  TextField, FormControlLabel, Checkbox,
} from '@mui/material';
import { useTranslation } from '../../common/components/LocalizationProvider';
import SelectField from '../../common/components/SelectField';
import { prefixString } from '../../common/util/stringUtils';
import useCommandAttributes from '../../common/attributes/useCommandAttributes';

const BaseCommandView = ({ item, setItem }) => {
  const t = useTranslation();

  const availableAttributes = useCommandAttributes(t);

  const [attributes, setAttributes] = useState([]);

  useEffect(() => {
    if (item && item.type) {
      setAttributes(availableAttributes[item.type] || []);
    } else {
      setAttributes([]);
    }
  }, [availableAttributes, item]);

  return (
    <>
      <SelectField
        value={item.type || ''}
        onChange={(e) => setItem({ ...item, type: e.target.value, attributes: {} })}
        endpoint="/api/commands/types"
        keyGetter={(it) => it.type}
        titleGetter={(it) => t(prefixString('command', it.type))}
        label={t('sharedType')}
      />
      {attributes.map(({ key, name, type }) => {
        if (type === 'boolean') {
          return (
            <FormControlLabel
              control={(
                <Checkbox
                  checked={item.attributes[key]}
                  onChange={(e) => {
                    const updateItem = { ...item, attributes: { ...item.attributes } };
                    updateItem.attributes[key] = e.target.checked;
                    setItem(updateItem);
                  }}
                />
              )}
              label={name}
            />
          );
        }
        return (
          <TextField
            type={type === 'number' ? 'number' : 'text'}
            value={item.attributes[key]}
            onChange={(e) => {
              const updateItem = { ...item, attributes: { ...item.attributes } };
              updateItem.attributes[key] = type === 'number' ? Number(e.target.value) : e.target.value;
              setItem(updateItem);
            }}
            label={name}
          />
        );
      })}
      <FormControlLabel
        control={<Checkbox checked={item.textChannel} onChange={(event) => setItem({ ...item, textChannel: event.target.checked })} />}
        label={t('commandSendSms')}
      />
    </>
  );
};

export default BaseCommandView;
