// Copyright 2022 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useState, useEffect } from 'react';
import { useModal } from 'contexts/Modal';
import { useBalances } from 'contexts/Balances';
import { useApi } from 'contexts/Api';
import { useConnect } from 'contexts/Connect';
import { useSubmitExtrinsic } from 'library/Hooks/useSubmitExtrinsic';
import { Warning } from 'library/Form/Warning';
import { APIContextInterface } from 'types/api';
import { ConnectContextInterface } from 'types/connect';
import { usePools } from 'contexts/Pools';
import { Separator, NotesWrapper } from '../../Wrappers';
import { FormFooter } from './FormFooter';

export const BondAll = (props: any) => {
  const { setSection } = props;

  const { api, network } = useApi() as APIContextInterface;
  const { units } = network;
  const { setStatus: setModalStatus, setResize, config }: any = useModal();
  const { activeAccount } = useConnect() as ConnectContextInterface;
  const { getBondOptions }: any = useBalances();
  const { getPoolBondOptions } = usePools();
  const { target } = config;

  const stakeBondOptions = getBondOptions(activeAccount);
  const poolBondOptions = getPoolBondOptions(activeAccount);
  const isStaking = target === 'stake';
  const isPooling = target === 'pool';

  const { freeToBond } = isPooling ? poolBondOptions : stakeBondOptions;
  const { totalPossibleBond } = isPooling ? poolBondOptions : stakeBondOptions;

  // local bond value
  const [bond, setBond] = useState(freeToBond);

  // bond valid
  const [bondValid, setBondValid]: any = useState(false);

  // update bond value on task change
  useEffect(() => {
    const _bond = freeToBond;
    setBond({ bond: _bond });
    if (freeToBond > 0) {
      setBondValid(true);
    } else {
      setBondValid(false);
    }
  }, [freeToBond]);

  // modal resize on form update
  useEffect(() => {
    setResize();
  }, [bond]);

  // tx to submit
  const tx = () => {
    let _tx = null;
    if (!bondValid || !api || !activeAccount) {
      return _tx;
    }

    // remove decimal errors
    const bondToSubmit = Math.floor(bond.bond * 10 ** units).toString();

    // determine _tx
    if (isPooling) {
      _tx = api.tx.nominationPools.bondExtra({ FreeBalance: bondToSubmit });
    } else if (isStaking) {
      _tx = api.tx.staking.bondExtra(bondToSubmit);
    }
    return _tx;
  };

  const { submitTx, estimatedFee, submitting }: any = useSubmitExtrinsic({
    tx: tx(),
    from: activeAccount,
    shouldSubmit: bondValid,
    callbackSubmit: () => {
      setModalStatus(0);
    },
    callbackInBlock: () => {},
  });

  const TxFee = (
    <p>Estimated Tx Fee: {estimatedFee === null ? '...' : `${estimatedFee}`}</p>
  );

  return (
    <>
      <div className="items">
        <>
          {freeToBond === 0 && (
            <Warning text={`You have no free ${network.unit} to bond.`} />
          )}
          <h4>Amount to bond:</h4>
          <h2>
            {freeToBond} {network.unit}
          </h2>
          <p>
            This amount of {network.unit} will be added to your current bonded
            funds.
          </p>
          <Separator />
          <h4>New total bond:</h4>
          <h2>
            {totalPossibleBond} {network.unit}
          </h2>
          <NotesWrapper>{TxFee}</NotesWrapper>
        </>
      </div>
      <FormFooter
        setSection={setSection}
        submitTx={submitTx}
        submitting={submitting}
        isValid={bondValid}
      />
    </>
  );
};