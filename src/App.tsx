import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import { useMachine } from '@xstate/react';
import { createMachine } from 'xstate';

const toggleMachine = createMachine({
    id: 'toggle',
    type: 'parallel',
    context: {
        aValue: 0
    },
    states: {

        firstState: {
            initial: 'inactive',
            states: {
                inactive: {
                    on: { TOGGLE: 'active' },
                    entry: ['increment']
                },
                active: {
                    on: { TOGGLE: 'inactive' }
                }
            }
        },
        secondState: {
            initial: 'one',
            states: {
                one: {
                    on: { TWO: 'two' }
                },
                two: {
                    on: { ONE: 'one' }
                }
            }
        }
    },
},
    {
        actions: {
            increment: (context, event) => {
                console.log(event);
                context.aValue++;
            }
        }
    }
);

function App() {
    const [state, send] = useMachine(toggleMachine);

    console.log(state.context.aValue);

    return (
        <button onClick={() => send({ type: 'TOGGLE', data: 'hello' })}>
            {state.value.firstState === 'inactive'
                ? 'Click to activate'
                : 'Active! Click to deactivate'}
        </button>
    );
}

export default App
