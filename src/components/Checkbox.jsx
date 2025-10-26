import '../style.css';

function Checkbox(props) {
  return (
    <>
      <div className="preference">
        <label className="category-name">
          <input type="checkbox" name={props.id} checked={props.checked} onChange={props.function} />
          <span className="category-block">{props.value}</span>
        </label>
      </div>
    </>
  );
}

export default Checkbox;

