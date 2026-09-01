import { render, screen, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import UserProfile from "./UserProfile";

test('renders user name after fetching data', async() => {
    global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({name: 'Jiamu'}),
    })
);
render(<UserProfile />);

expect(screen.getByText('Loading...')).toBeInTheDocument();

await waitFor(() => {
    expect(screen.getByTestId('user-name')).toHaveTextContent('Jiamu');
});
expect(fetch).toHaveBeenCalledTimes(1);
})