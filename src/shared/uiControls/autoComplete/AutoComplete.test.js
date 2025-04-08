import { render, screen, fireEvent } from '@testing-library/react';
import AutoComplete from './AutoComplete';

describe('AutoComplete Component Unit Testing', () => {
  const options = [
    { label: 'Cairo', value: 'Cairo' },
    { label: 'Alex', value: 'Alex' },
    { label: 'Giza', value: 'Giza' },
    { label: 'Sinai', value: 'Sinai' },
  ];
  test('AutoComplete should render with a default value', () => {
    render(<AutoComplete value="Result" />);
    expect(screen.getByRole('combobox')).toHaveAttribute('value', 'Result');
  });
  test('AutoComplete should filter options with the input value', () => {
    render(<AutoComplete options={options} value="ai" />);
    fireEvent.mouseDown(screen.getByRole('combobox'));

    expect(screen.getByTitle('Cairo')).toBeInTheDocument();
    expect(screen.getByTitle('Sinai')).toBeInTheDocument();
  });
});
