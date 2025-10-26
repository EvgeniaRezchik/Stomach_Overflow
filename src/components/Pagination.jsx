import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import '../style.css';

function Pagination(props) {
  const [pagesNums, setPagesNums] = useState([]);
  useEffect(() => {
    let temp = [];
    for (let i = 0; i < props.pages; i += 1)
      temp.push(i);
    setPagesNums(temp);
  }, [props.pages]);
  return (
    <>
      <div className="pagination">
        <button disabled={props.page === 0 ? true:false} onClick={props.leftFunction}>
          <FaChevronLeft color="#fff" />
        </button>
        {pagesNums && pagesNums.length > 0 && pagesNums.map((num) => <button key={num} name={num} className={num === props.page ? "current-page":""} onClick={props.pageFunction}>{num + 1}</button>)}
        <button disabled={props.page === props.pages - 1 ? true:false} onClick={props.rightFunction}>
          <FaChevronRight color="#fff" />
        </button>
      </div>
    </>
  );
}

export default Pagination;

