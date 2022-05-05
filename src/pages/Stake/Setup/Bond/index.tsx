// Copyright 2022 @rossbulat/polkadot-staking-experience authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useState } from 'react';
import { planckToDot } from '../../../../Utils';
import { useApi } from '../../../../contexts/Api';
import { useConnect } from '../../../../contexts/Connect';
import { useBalances } from '../../../../contexts/Balances';
import { useStaking } from '../../../../contexts/Staking';
import { useUi } from '../../../../contexts/UI';
import { SectionWrapper } from '../../../../library/Graphs/Wrappers';
import { Spacer } from '../../Wrappers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag } from '@fortawesome/free-regular-svg-icons';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { MotionContainer } from '../MotionContainer';
import { Warning, BondStatus } from './Wrappers';
import { RESERVE_AMOUNT_PLANCK } from '../../../../constants';
import { BondInput } from '../../../../library/Form/BondInput';
import { OpenAssistantIcon } from '../../../../library/OpenAssistantIcon';

export const Bond = (props: any) => {

  const { section } = props;

  const { network }: any = useApi();
  const { activeAccount } = useConnect();
  const { staking, eraStakers } = useStaking();
  const { getAccountBalance }: any = useBalances();
  const { getSetupProgress, setActiveAccountSetup } = useUi();

  const { minNominatorBond } = staking;
  const { minActiveBond } = eraStakers;
  const balance = getAccountBalance(activeAccount);
  let { free } = balance;
  const setup = getSetupProgress(activeAccount);

  let freeAfterReserve: any = free - RESERVE_AMOUNT_PLANCK;
  freeAfterReserve = freeAfterReserve < 0 ? 0 : freeAfterReserve;

  const initialBondValue = setup.bond === 0
    ? freeAfterReserve
    : setup.bond;

  // store local bond amount for form control
  const [bond, setBond] = useState({
    bond: initialBondValue
  });

  // handle errors

  let errors = [];
  let bondDisabled = false;

  // pre-bond input errors

  if (freeAfterReserve === 0) {
    bondDisabled = true;
    errors.push(`You have no free ${network.unit} to bond.`);
  }

  if (freeAfterReserve < minNominatorBond) {
    bondDisabled = true;
    errors.push(`You do not meet the minimum nominator bond of ${planckToDot(minNominatorBond)} ${network.unit}.`);
  }

  // bond input errors

  if (bond < minNominatorBond && bond.bond !== '' && bond.bond !== 0) {
    errors.push(`Bond amount must be at least ${planckToDot(minNominatorBond)} ${network.unit}.`);
  }

  if (bond > freeAfterReserve) {
    errors.push(`Bond amount is more than your free balance.`);
  }

  const gtMinNominatorBond = bond.bond >= planckToDot(minNominatorBond);
  const gtMinActiveBond = bond.bond >= minActiveBond;

  return (
    <SectionWrapper transparent>
      <Header
        thisSection={section}
        complete={setup.bond !== 0}
        title='Bond'
        assistantPage='stake'
        assistantKey='Bonding'
      />
      <MotionContainer
        thisSection={section}
        activeSection={setup.section}
      >
        {errors.map((err: any, index: any) =>
          <Warning key={`setup_error_${index}`}>
            <FontAwesomeIcon icon={faExclamationTriangle} transform="shrink-2" />
            <h4>{err}</h4>
          </Warning>
        )}

        {!errors.length &&
          <h4>Available: {planckToDot(freeAfterReserve)} {network.unit}</h4>
        }
        <Spacer />
        <BondInput
          parentState={setup}
          setParentState={setActiveAccountSetup}
          disabled={bondDisabled}
          setters={[
            {
              set: setActiveAccountSetup,
              current: setup
            }, {
              set: setBond,
              current: bond,
            }
          ]}
        />
        <BondStatus>
          <div className='bars'>
            <section className={gtMinNominatorBond ? `invert` : ``}>
              <h4>&nbsp;</h4>
              <div className='bar'>
                <h5>Inactive</h5>
              </div>
            </section>
            <section className={gtMinNominatorBond ? `invert` : ``}>
              <h4>
                <FontAwesomeIcon icon={faFlag} transform="shrink-4" />
                &nbsp;
                Nominate
                <OpenAssistantIcon page='stake' title='Nominating' />
              </h4>
              <div className='bar'>
                <h5>{planckToDot(minNominatorBond)} {network.unit}</h5>
              </div>
            </section>
            <section className={gtMinActiveBond ? `invert` : ``}>
              <h4>
                <FontAwesomeIcon icon={faFlag} transform="shrink-4" />
                &nbsp;
                Active
                <OpenAssistantIcon page='stake' title='Active Bond Threshold' />
              </h4>
              <div className='bar'>
                <h5>{minActiveBond} {network.unit}</h5>
              </div>
            </section>
          </div>
        </BondStatus>
        <Footer complete={setup.bond !== 0} />
      </MotionContainer>
    </SectionWrapper>
  )
}

export default Bond;