import './App.css'
import { useMachine } from '@xstate/react';
import { createMachine, assign } from 'xstate';

function fakeAPI() {
    return new Promise<string[]>(resolve => {
        setTimeout(() => {
            resolve(['one', 'two', 'three']);
        }, 2000);
    });
}

const toggleMachine = createMachine({
    predictableActionArguments: true,
    id: 'toggle',
    context: {
        selectedValues: undefined,
        values: [],
    },
    initial: 'loading',
    states: {
        loading: {
            invoke: {
                src: () => {
                    console.log('Fetching values');
                    return fakeAPI();
                },
                onDone: {
                    target: 'loaded',
                    actions: assign({ values: (_: any, event) => event.data }),
                }
            },
        },
        loaded: {
            entry: () => {
                console.log('initialized');
            },
        },
        valueSelected: {
            entry: () => {
                console.log('value selected');
            },
        },
    },
});

function App() {
    const [state, send] = useMachine(toggleMachine);
    const isLoading = state.matches('loading');

    console.log('the state', state.context.values);

    if (isLoading) {
        return (
            <p>Loading....</p>
        );
    }

    return (
        <ul>
            {state.context.values.map((value, index) => (
                <li key={index}>{value}</li>
            ))}
        </ul>
    );
}

export default App
