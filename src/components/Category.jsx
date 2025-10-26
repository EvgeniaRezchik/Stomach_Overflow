import { Link } from "react-router-dom";
import '../style.css';

function Category(props) {
  return (
    <>
      <Link to={`/category/${props.id}`}>
        <div className="category-block" title={props.description !== null ? props.description:"This category has no description"}>{props.title}</div>
      </Link>
    </>
  );
}

export default Category;

