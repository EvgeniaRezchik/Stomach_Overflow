import '../style.css';

function Radio(props) {
  return (
    <>
      <div className="preference">
        <label className="category-name">
          <input type="radio" name={props.name} value={props.value} checked={props.checked} onChange={props.function} />
          <span className="category-block">{props.note}</span>
        </label>
      </div>
    </>
  );
}

export default Radio;

