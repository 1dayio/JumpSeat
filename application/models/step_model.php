<?
/**
 * Aero Steps
 *
 * Aero step model
 *
 * @package		Aero
 * @subpackage	Step_Model
 * @category	CI_Model
 * @author		Mike Priest
*/
class Step_Model extends CI_Model
{
	private $id = null;
	private $collection = null;
	private $host = null;

	/**
	 * Constructor
	*/
	function __construct($host, $guideid)
	{
		// Call the Model constructor
		parent::__construct();
		$this->load->library('mongo_db');

		//Load from config
		$this->id = $guideid;
		$this->host = $host;
		$this->load->config('config', TRUE);

		$this->collection = $this->host . "_" . GUIDES;
		$this->load->model('guide_model', '', FALSE, $this->host);
        $this->load->model('version_model', '', FALSE, $this->host);
	}


	/**
	 * Get all guides from mongo
	 * @param array $order_by order of tours
	 * @return array $guides
	 */
	public function insertAt($index, $steps)
	{
		$guide = $this->guide_model->get_by_id($this->id);

		unset($steps['id']);

		if(sizeof($guide) > 0){

			array_splice( $guide["step"], $index, 0, array( $steps));

			//Update the DB
			$this->save($guide);

			return $guide;
		}else{
			return false;
		}
	}

	/**
	 * Update a step with new data
	 * @param integer $index step index
	 * @param array $data data
	 * @return array $guide
	 */
	public function update($index, $data)
	{
		unset($data['id']);
		unset($data['host']);

		$guide = $this->guide_model->get_by_id($this->id);

        //@todo allow multiple restrict
        $guide['restrict'] = array();
        if(isset($data['isRestrict']) && $data['isRestrict']) $guide['restrict']['s' . $index] = $data['restrictColor'];

		if($guide){
			$guide["step"][$index] = $data;

			//Update the DB
			$this->save($guide);

			return $guide;
		}else{
			return false;
		}
	}


	/**
	 * Moves a step to a new index position
	 * @param integer $from
	 * @param integer $to
	 * @return array $guide
	 */
	public function moveIndex($from, $to)
	{
		$guide = $this->guide_model->get_by_id($this->id);

		if($guide){

			$out = array_splice($guide["step"], $from, 1);
			array_splice($guide["step"], $to, 0, $out);

			//Update the DB
			$this->save($guide);

			return $guide;

		}else{
			return false;
		}
	}

	/**
	 * Delete a step by index
	 * @param array $order_by order of tours
	 * @return array $guides
	 */
	public function deleteAt($index)
	{
		$guide = $this->guide_model->get_by_id($this->id);

		if($guide){

			unset($guide["step"][$index]);

			$guide["step"] = array_values($guide["step"]);

			//Update the DB
			$this->save($guide);

			return $guide;

		}else{
			return false;
		}
	}

	private function save($guide){

		$this->guide_model->update_cache();
        $guide['version'] = $this->version_model->get_current_version($this->id) + 1;

		//Update the DB
		$success = $this->mongo_db
			->where(array('_id' => new MongoId($this->id)))
			->set( (array) $guide )
			->update($this->collection);

        $this->version_model->update($this->id, $guide);

		return $success;

	}
}
